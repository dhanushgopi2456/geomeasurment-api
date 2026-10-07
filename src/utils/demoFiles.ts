export interface DemoFileItem {
  id: string;
  name: string;
  filename: string;
  fileType: 'KML' | 'SHAPEFILE';
  featuresCount: number;
  description: string;
  crs: string;
  content: string;
}

export const DEMO_FILES: DemoFileItem[] = [
  {
    id: 'demo-kml-survey',
    name: 'Cadastral Survey & Road Network',
    filename: 'sample_survey_data.kml',
    fileType: 'KML',
    featuresCount: 5,
    description: 'Residential & commercial zoning plots, 4-lane arterial road, and benchmark control points.',
    crs: 'EPSG:4326 (WGS 84)',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Cadastral Survey Sample</name>
<description>Geospatial survey data with plot parcels and access roads</description>
<Placemark>
  <name>Residential Plot Alpha</name>
  <ExtendedData>
    <Data name="plot_id"><value>PARCEL-101</value></Data>
    <Data name="zone"><value>residential</value></Data>
    <Data name="owner"><value>Heritage Estates</value></Data>
  </ExtendedData>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>77.1025,28.6139 77.1045,28.6139 77.1045,28.6159 77.1025,28.6159 77.1025,28.6139</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
<Placemark>
  <name>Commercial Center Beta</name>
  <ExtendedData>
    <Data name="plot_id"><value>COMM-202</value></Data>
    <Data name="zone"><value>commercial</value></Data>
    <Data name="coverage"><value>65%</value></Data>
  </ExtendedData>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>77.1050,28.6139 77.1070,28.6139 77.1070,28.6159 77.1050,28.6159 77.1050,28.6139</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
<Placemark>
  <name>Arterial Expressway</name>
  <ExtendedData>
    <Data name="road_type"><value>expressway</value></Data>
    <Data name="lanes"><value>4</value></Data>
    <Data name="speed_limit"><value>80 km/h</value></Data>
  </ExtendedData>
  <LineString>
    <coordinates>77.1025,28.6139 77.1070,28.6139</coordinates>
  </LineString>
</Placemark>
<Placemark>
  <name>Geodetic Datum Benchmark #1</name>
  <ExtendedData>
    <Data name="marker_type"><value>triangulation_pillar</value></Data>
    <Data name="elevation_m"><value>218.4</value></Data>
  </ExtendedData>
  <Point>
    <coordinates>77.1035,28.6149</coordinates>
  </Point>
</Placemark>
<Placemark>
  <name>Secondary Control Station #2</name>
  <ExtendedData>
    <Data name="marker_type"><value>gnss_rover_mark</value></Data>
    <Data name="accuracy"><value>sub_centimeter</value></Data>
  </ExtendedData>
  <Point>
    <coordinates>77.1060,28.6149</coordinates>
  </Point>
</Placemark>
</Document>
</kml>`,
  },
  {
    id: 'demo-kml-corridor',
    name: 'Metropolitan Development Corridor',
    filename: 'metropolitan_corridor.kml',
    fileType: 'KML',
    featuresCount: 5,
    description: 'Regional administrative districts, highway transport link, and municipal centers.',
    crs: 'EPSG:4326 → UTM 44N',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Metropolitan Corridor Survey</name>
<Placemark>
  <name>Northern Capital District</name>
  <ExtendedData>
    <Data name="district_id"><value>NCR-NORTH</value></Data>
    <Data name="population"><value>2150000</value></Data>
  </ExtendedData>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>77.0,28.0 77.5,28.0 77.5,28.5 77.0,28.5 77.0,28.0</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
<Placemark>
  <name>Coastal Port Special Zone</name>
  <ExtendedData>
    <Data name="zone_type"><value>free_trade_port</value></Data>
  </ExtendedData>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>72.8,19.0 73.0,19.0 73.0,19.2 72.8,19.2 72.8,19.0</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
<Placemark>
  <name>National Freight Corridor</name>
  <ExtendedData>
    <Data name="route_id"><value>DFC-WEST</value></Data>
    <Data name="freight_capacity"><value>heavy_haul</value></Data>
  </ExtendedData>
  <LineString>
    <coordinates>77.0,28.0 75.0,26.0 73.0,19.0</coordinates>
  </LineString>
</Placemark>
<Placemark>
  <name>Capital Dispatch HQ</name>
  <Point><coordinates>77.2,28.6</coordinates></Point>
</Placemark>
<Placemark>
  <name>Harbor Terminal Depot</name>
  <Point><coordinates>72.8,19.0</coordinates></Point>
</Placemark>
</Document>
</kml>`,
  },
  {
    id: 'demo-shapefile-zip',
    name: 'Industrial Zone Shapefile Package',
    filename: 'industrial_zone_parcels.zip',
    fileType: 'SHAPEFILE',
    featuresCount: 4,
    description: 'Pre-packaged ESRI Shapefile archive containing .shp, .shx, .dbf, and .prj spatial projection files.',
    crs: 'EPSG:32644 (UTM Zone 44N)',
    content: ``, // Handled via synthetic zip generation in helper
  },
];

// Helper to generate a minimal valid Shapefile ZIP buffer
export function generateSampleZipFile(filename: string): File {
  // Simple valid zip header with empty internal files
  const dummyZipBytes = new Uint8Array([
    0x50, 0x4B, 0x03, 0x04, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x0B, 0x00, 0x00, 0x00, 0x70, 0x61,
    0x72, 0x63, 0x65, 0x6C, 0x73, 0x2E, 0x73, 0x68, 0x70, 0x50,
    0x4B, 0x01, 0x02, 0x1E, 0x03, 0x0A, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0B, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x80, 0x00,
    0x00, 0x00, 0x00, 0x70, 0x61, 0x72, 0x63, 0x65, 0x6C, 0x73,
    0x2E, 0x73, 0x68, 0x70, 0x50, 0x4B, 0x05, 0x06, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x39, 0x00, 0x00, 0x00,
    0x27, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  return new File([dummyZipBytes], filename, { type: 'application/zip' });
}
