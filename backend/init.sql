-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create AIS tracks table
CREATE TABLE IF NOT EXISTS ais_tracks (
    id SERIAL PRIMARY KEY,
    mmsi VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    heading INTEGER,
    vessel_name VARCHAR(100),
    vessel_type INTEGER,
    geom GEOMETRY(Point, 4326)
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_ais_tracks_geom ON ais_tracks USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_ais_tracks_mmsi ON ais_tracks(mmsi);
CREATE INDEX IF NOT EXISTS idx_ais_tracks_timestamp ON ais_tracks(timestamp);

-- Create ENC layers table
CREATE TABLE IF NOT EXISTS enc_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB
);
