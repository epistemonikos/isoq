/**
 * Script temporal para generar iconos PWA placeholder
 * Genera PNGs básicos azules (#007bff) como placeholder
 *
 * Ejecutar: node scripts/generate-icons.js
 *
 * NOTA: Reemplazar estos iconos con los iconos oficiales de la aplicación
 */

const fs = require('fs')
const path = require('path')

// PNG básico de un solo color - estructura mínima
// Esto crea un PNG válido de un color sólido
function createSolidColorPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // color type (RGB)
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT chunk (compressed image data)
  const zlib = require('zlib')
  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3)
    rawData[rowStart] = 0 // filter byte
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3
      rawData[pixelStart] = r
      rawData[pixelStart + 1] = g
      rawData[pixelStart + 2] = b
    }
  }
  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)

  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

// CRC32 implementation for PNG
function crc32(buffer) {
  let crc = 0xFFFFFFFF
  const table = getCRC32Table()

  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF]
  }

  return crc ^ 0xFFFFFFFF
}

let crcTable = null
function getCRC32Table() {
  if (crcTable) return crcTable

  crcTable = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[i] = c
  }
  return crcTable
}

// Color #007bff en RGB
const r = 0x00
const g = 0x7b
const b = 0xff

const iconsDir = path.join(__dirname, '..', 'static', 'icons')

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generar iconos
const sizes = [192, 512]

sizes.forEach(size => {
  const png = createSolidColorPNG(size, size, r, g, b)
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)
  fs.writeFileSync(filepath, png)
  console.log(`Created: ${filepath}`)
})

console.log('\nPlaceholder icons created successfully!')
console.log('Remember to replace these with your actual app icons.')
