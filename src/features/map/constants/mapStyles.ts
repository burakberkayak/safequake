export type MapStyleType = 'bright' | 'liberty' | 'dark' | 'satellite';

const BRIGHT_MAP_URL = 'https://tiles.openfreemap.org/styles/bright';
const LIBERTY_MAP_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DARK_MAP_URL = 'https://tiles.openfreemap.org/styles/dark';

// Esri'nin ücretsiz, anahtarsız uydu raster tile servisi.
const SATELLITE_STYLE_JSON = JSON.stringify({
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

export const getMapStyleUrl = (type: MapStyleType): string => {
  switch (type) {
    case 'satellite':
      return SATELLITE_STYLE_JSON;
    case 'dark':
      return DARK_MAP_URL;
    case 'liberty':
      return LIBERTY_MAP_URL;
    case 'bright':
    default:
      return BRIGHT_MAP_URL;
  }
};
