// Génère les icônes PWA (PNG) et le favicon SVG sans dépendance externe.
// Motif : un haltère clair sur fond sombre arrondi. Usage : npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const BG = [17, 21, 28]
const FG = [94, 234, 212]

// Formes en coordonnées normalisées (0..1) : rectangles arrondis de l'haltère.
const shapes = [
  { x: 0.2, y: 0.47, w: 0.6, h: 0.06, r: 0.02 }, // barre
  { x: 0.24, y: 0.3, w: 0.09, h: 0.4, r: 0.03 }, // disque gauche
  { x: 0.67, y: 0.3, w: 0.09, h: 0.4, r: 0.03 }, // disque droit
  { x: 0.15, y: 0.37, w: 0.07, h: 0.26, r: 0.025 }, // petit disque gauche
  { x: 0.78, y: 0.37, w: 0.07, h: 0.26, r: 0.025 }, // petit disque droit
]

function inRoundRect(px, py, { x, y, w, h, r }) {
  if (px < x || px > x + w || py < y || py > y + h) return false
  const cx = Math.min(Math.max(px, x + r), x + w - r)
  const cy = Math.min(Math.max(py, y + r), y + h - r)
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, { rounded }) {
  const SS = 4 // suréchantillonnage pour l'anticrénelage
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const bgShape = { x: 0, y: 0, w: 1, h: 1, r: rounded ? 0.22 : 0 }
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let bgCov = 0, fgCov = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size
          const py = (y + (sy + 0.5) / SS) / size
          if (rounded ? inRoundRect(px, py, bgShape) : true) {
            bgCov++
            if (shapes.some((s) => inRoundRect(px, py, s))) fgCov++
          }
        }
      const a = bgCov / (SS * SS)
      const f = bgCov ? fgCov / bgCov : 0
      const o = y * (size * 4 + 1) + 1 + x * 4
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(BG[c] * (1 - f) + FG[c] * f)
      raw[o + 3] = Math.round(a * 255)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Icônes « maskable » : fond plein (le système applique son propre masque).
writeFileSync(join(OUT, 'icon-192.png'), png(192, { rounded: false }))
writeFileSync(join(OUT, 'icon-512.png'), png(512, { rounded: false }))
writeFileSync(join(OUT, 'apple-touch-icon.png'), png(180, { rounded: false }))

const rect = (s) => `<rect x="${s.x * 64}" y="${s.y * 64}" width="${s.w * 64}" height="${s.h * 64}" rx="${s.r * 64}"/>`
writeFileSync(
  join(OUT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#11151c"/><g fill="#5eead4">${shapes.map(rect).join('')}</g></svg>\n`,
)
console.log('Icônes générées dans public/')
