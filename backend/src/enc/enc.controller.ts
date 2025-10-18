import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EncService } from './enc.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Controller('api/enc')
export class EncController {
  constructor(private readonly encService: EncService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './data/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(000|s57)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only S-57 files (.000, .s57) are allowed'), false);
        }
      },
    }),
  )
  async uploadEncFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Convert S-57 to GeoJSON
      const outputName = path.parse(file.originalname).name;
      const geoJsonPath = await this.encService.convertS57ToGeoJSON(file.path, outputName);

      // Save layer info to database
      const layer = await this.encService.saveEncLayer(
        outputName,
        'ENC',
        geoJsonPath,
        {
          originalFile: file.originalname,
          uploadedAt: new Date(),
        },
      );

      // Clean up uploaded S-57 file
      await fs.unlink(file.path);

      return {
        success: true,
        message: 'ENC file uploaded and converted successfully',
        layer: {
          id: layer.id,
          name: layer.name,
          type: layer.layerType,
        },
      };
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(file.path);
      } catch {}
      
      throw new BadRequestException(`Failed to process ENC file: ${error.message}`);
    }
  }

  @Get('layers')
  async getLayers() {
    const layers = await this.encService.getAllLayers();
    return {
      success: true,
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.layerType,
        createdAt: layer.createdAt,
        metadata: layer.metadata,
      })),
    };
  }

  @Get('layers/:id')
  async getLayer(@Param('id') id: string) {
    const layer = await this.encService.getLayerById(parseInt(id));
    if (!layer) {
      throw new NotFoundException('Layer not found');
    }

    return {
      success: true,
      layer: {
        id: layer.id,
        name: layer.name,
        type: layer.layerType,
        createdAt: layer.createdAt,
        metadata: layer.metadata,
      },
    };
  }

  @Get('layers/:id/geojson')
  async getLayerGeoJSON(@Param('id') id: string) {
    try {
      const geoJson = await this.encService.getLayerGeoJSON(parseInt(id));
      return geoJson;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete('layers/:id')
  async deleteLayer(@Param('id') id: string) {
    await this.encService.deleteLayer(parseInt(id));
    return {
      success: true,
      message: 'Layer deleted successfully',
    };
  }
}
