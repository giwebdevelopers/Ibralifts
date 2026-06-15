// Generate PWA PNG icons from an inline SVG mark using sharp.
// Run with: npm run icons
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const mark = `
  <g fill="#f3efe6">
    <rect x="120" y="200" width="34" height="112" rx="16" />
    <rect x="164" y="176" width="34" height="160" rx="16" />
    <rect x="198" y="242" width="116" height="28" rx="14" />
    <rect x="314" y="176" width="34" height="160" rx="16" />
    <rect x="358" y="200" width="34" height="112" rx="16" />
  </g>`

const rounded = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#2b2a26" />${mark}
</svg>`

// Maskable / apple: full-bleed square so platform masking never clips the tile.
const square = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2b2a26" />${mark}
</svg>`

const jobs = [
  { svg: rounded, size: 192, name: 'pwa-192x192.png' },
  { svg: rounded, size: 512, name: 'pwa-512x512.png' },
  { svg: square, size: 512, name: 'pwa-maskable-512x512.png' },
  { svg: square, size: 180, name: 'apple-touch-icon-180.png' },
]

for (const job of jobs) {
  await sharp(Buffer.from(job.svg))
    .resize(job.size, job.size)
    .png()
    .toFile(join(publicDir, job.name))
  console.log('wrote', job.name)
}
console.log('done')
