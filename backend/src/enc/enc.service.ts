import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncLayer } from './entities/enc-layer.entity';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class EncService {
  private readonly logger = new Logger(EncService.name);
  private readonly dataDir = path.join(process.cwd(), 'data', 'enc');
  private readonly uploadsDir = path.join(process.cwd(), 'data', 'uploads');

  constructor(
    @InjectRepository(EncLayer)
    private encLayerRepository: Repository<EncLayer>,
  ) {}

  async convertS57ToGeoJSON(inputPath: string, outputName: string): Promise<string> {
    const outputPath = path.join(this.dataDir, `${outputName}.geojson`);
    
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // First, get list of layers in the S-57 file
      this.logger.log(`Listing layers in S-57 file: ${inputPath}`);
      const listCommand = `ogrinfo -so "${inputPath}"`;
      const { stdout: layerList } = await execAsync(listCommand);
      
      // Extract layer names from ogrinfo output
      const layerNames = layerList
        .split('\n')
        .filter(line => line.match(/^\d+:/))
        .map(line => line.split(':')[1].trim().split(' ')[0]);
      
      this.logger.log(`Found ${layerNames.length} layers: ${layerNames.join(', ')}`);
      
      // Convert all layers and merge into one GeoJSON FeatureCollection
      const allFeatures: any[] = [];
      
      for (const layerName of layerNames) {
        try {
          const tempOutput = path.join(this.dataDir, `temp_${layerName}.geojson`);
          const command = `ogr2ogr -f GeoJSON "${tempOutput}" "${inputPath}" "${layerName}"`;
          
          this.logger.log(`Converting layer: ${layerName}`);
          await execAsync(command);
          
          // Read the converted layer
          const content = await fs.readFile(tempOutput, 'utf-8');
          const geojson = JSON.parse(content);
          
          // Add layer name to each feature's properties
          if (geojson.features) {
            geojson.features.forEach((feature: any) => {
              feature.properties = feature.properties || {};
              feature.properties.s57_layer = layerName;
            });
            allFeatures.push(...geojson.features);
          }
          
          // Clean up temp file
          await fs.unlink(tempOutput);
          
          this.logger.log(`Successfully converted layer: ${layerName} (${geojson.features?.length || 0} features)`);
        } catch (layerError) {
          this.logger.warn(`Failed to convert layer ${layerName}: ${layerError.message}`);
        }
      }
      
      // Create final GeoJSON FeatureCollection
      const finalGeoJSON = {
        type: 'FeatureCollection',
        features: allFeatures,
        properties: {
          source: 'S-57 ENC',
          layers: layerNames,
          totalFeatures: allFeatures.length
        }
      };
      
      // Write final GeoJSON
      await fs.writeFile(outputPath, JSON.stringify(finalGeoJSON, null, 2));
      
      this.logger.log(`Conversion successful: ${outputPath} (${allFeatures.length} total features from ${layerNames.length} layers)`);
      return outputPath;
    } catch (error) {
      this.logger.error(`Conversion failed: ${error.message}`);
      throw new Error(`Failed to convert S-57 file: ${error.message}`);
    }
  }

  async saveEncLayer(name: string, layerType: string, filePath: string, metadata?: any): Promise<EncLayer> {
    const layer = this.encLayerRepository.create({
      name,
      layerType,
      filePath,
      metadata,
    });

    return await this.encLayerRepository.save(layer);
  }

  async getAllLayers(): Promise<EncLayer[]> {
    return await this.encLayerRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getLayerById(id: number): Promise<EncLayer> {
    return await this.encLayerRepository.findOne({ where: { id } });
  }

  async getLayerGeoJSON(id: number): Promise<any> {
    const layer = await this.getLayerById(id);
    if (!layer) {
      throw new Error('Layer not found');
    }

    const content = await fs.readFile(layer.filePath, 'utf-8');
    return JSON.parse(content);
  }

  async deleteLayer(id: number): Promise<void> {
    const layer = await this.getLayerById(id);
    if (layer) {
      // Delete file
      try {
        await fs.unlink(layer.filePath);
      } catch (error) {
        this.logger.warn(`Could not delete file: ${error.message}`);
      }
      
      // Delete database record
      await this.encLayerRepository.delete(id);
    }
  }
}
