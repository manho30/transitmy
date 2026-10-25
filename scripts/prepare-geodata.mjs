import { readFile, writeFile } from 'node:fs/promises'

/**
 * Reproducible OSM preprocessing skeleton.
 * Usage: node scripts/prepare-geodata.mjs /absolute/path/to/osm-export.geojson
 */
const inputPath = process.argv[2]
if (!inputPath) {
  throw new Error('Provide absolute path to source GeoJSON export')
}

const raw = JSON.parse(await readFile(inputPath, 'utf8'))

const features = (raw.features ?? []).filter((feature) => {
  const highway = feature.properties?.highway
  const waterway = feature.properties?.waterway
  const railway = feature.properties?.railway
  const place = feature.properties?.place
  return Boolean(highway || waterway || railway || place)
})

await writeFile(
  new URL('../src/data/regions/klang-valley/geography.processed.preview.json', import.meta.url),
  JSON.stringify(
    {
      source: 'OpenStreetMap',
      extractedAt: new Date().toISOString().slice(0, 10),
      featureCount: features.length,
      features,
    },
    null,
    2,
  ),
)

console.log(`Prepared ${features.length} features`)
