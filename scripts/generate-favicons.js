import fs from 'node:fs'
import zlib from 'node:zlib'

// Simple PNG decoder and encoder in pure Node.js (no extra npm packages needed)
// Reads 8-bit RGBA PNG, resizes with bilinear/box-sampling, outputs PNG, and builds multi-resolution .ico

function decodePNG(buffer) {
  // Check PNG signature
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== sig[i]) throw new Error('Not a valid PNG')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let idatChunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      const compression = data[10]
      const filter = data[11]
      const interlace = data[12]
      if (interlace !== 0) throw new Error('Interlaced PNG not supported in this simple decoder')
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  const compressed = Buffer.concat(idatChunks)
  const decompressed = zlib.inflateSync(compressed)

  // bytes per pixel
  let bpp = 4
  if (colorType === 6) {
    bpp = (bitDepth / 8) * 4 // RGBA
  } else if (colorType === 2) {
    bpp = (bitDepth / 8) * 3 // RGB
  } else {
    throw new Error(`Unsupported PNG color type: ${colorType}`)
  }

  const stride = width * (bitDepth / 8) * (colorType === 6 ? 4 : 3)
  const rgba = Buffer.alloc(width * height * 4)

  function paethPredictor(a, b, c) {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    if (pa <= pb && pa <= pc) return a
    if (pb <= pc) return b
    return c
  }

  let srcOffset = 0
  const rawBytesPerPixel = colorType === 6 ? (bitDepth / 8) * 4 : (bitDepth / 8) * 3
  const prevRow = Buffer.alloc(stride)
  const currentRow = Buffer.alloc(stride)

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcOffset++]
    for (let x = 0; x < stride; x++) {
      const byte = decompressed[srcOffset++]
      const left = x >= rawBytesPerPixel ? currentRow[x - rawBytesPerPixel] : 0
      const up = prevRow[x]
      const upLeft = x >= rawBytesPerPixel ? prevRow[x - rawBytesPerPixel] : 0

      let val = 0
      switch (filterType) {
        case 0: // None
          val = byte
          break
        case 1: // Sub
          val = (byte + left) & 0xff
          break
        case 2: // Up
          val = (byte + up) & 0xff
          break
        case 3: // Average
          val = (byte + Math.floor((left + up) / 2)) & 0xff
          break
        case 4: // Paeth
          val = (byte + paethPredictor(left, up, upLeft)) & 0xff
          break
        default:
          throw new Error(`Unknown filter type ${filterType}`)
      }
      currentRow[x] = val
    }

    // Convert row to RGBA 8-bit
    const rowOffset = y * width * 4
    for (let px = 0; px < width; px++) {
      const dstIdx = rowOffset + px * 4
      if (colorType === 6 && bitDepth === 8) {
        const srcIdx = px * 4
        rgba[dstIdx] = currentRow[srcIdx]
        rgba[dstIdx + 1] = currentRow[srcIdx + 1]
        rgba[dstIdx + 2] = currentRow[srcIdx + 2]
        rgba[dstIdx + 3] = currentRow[srcIdx + 3]
      } else if (colorType === 2 && bitDepth === 8) {
        const srcIdx = px * 3
        rgba[dstIdx] = currentRow[srcIdx]
        rgba[dstIdx + 1] = currentRow[srcIdx + 1]
        rgba[dstIdx + 2] = currentRow[srcIdx + 2]
        rgba[dstIdx + 3] = 255
      } else if (colorType === 6 && bitDepth === 16) {
        const srcIdx = px * 8
        rgba[dstIdx] = currentRow[srcIdx]
        rgba[dstIdx + 1] = currentRow[srcIdx + 2]
        rgba[dstIdx + 2] = currentRow[srcIdx + 4]
        rgba[dstIdx + 3] = currentRow[srcIdx + 6]
      }
    }

    currentRow.copy(prevRow)
  }

  return { width, height, data: rgba }
}

function resizeImage(src, targetW, targetH) {
  const dstData = Buffer.alloc(targetW * targetH * 4)
  const xRatio = src.width / targetW
  const yRatio = src.height / targetH

  for (let dy = 0; dy < targetH; dy++) {
    const srcYStart = dy * yRatio
    const srcYEnd = (dy + 1) * yRatio

    for (let dx = 0; dx < targetW; dx++) {
      const srcXStart = dx * xRatio
      const srcXEnd = (dx + 1) * xRatio

      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0,
        totalWeight = 0

      const y0 = Math.floor(srcYStart)
      const y1 = Math.min(Math.ceil(srcYEnd), src.height)
      const x0 = Math.floor(srcXStart)
      const x1 = Math.min(Math.ceil(srcXEnd), src.width)

      for (let sy = y0; sy < y1; sy++) {
        const yWeight = Math.min(sy + 1, srcYEnd) - Math.max(sy, srcYStart)
        for (let sx = x0; sx < x1; sx++) {
          const xWeight = Math.min(sx + 1, srcXEnd) - Math.max(sx, srcXStart)
          const weight = yWeight * xWeight

          const idx = (sy * src.width + sx) * 4
          const a = src.data[idx + 3] / 255
          // Pre-multiplied alpha weighting for cleaner anti-aliased edges
          rSum += src.data[idx] * a * weight
          gSum += src.data[idx + 1] * a * weight
          bSum += src.data[idx + 2] * a * weight
          aSum += src.data[idx + 3] * weight
          totalWeight += weight
        }
      }

      const dstIdx = (dy * targetW + dx) * 4
      const finalA = aSum / totalWeight
      if (finalA > 0.001) {
        const alphaRatio = 255 / finalA
        dstData[dstIdx] = Math.round(Math.min(255, Math.max(0, (rSum / totalWeight) * alphaRatio)))
        dstData[dstIdx + 1] = Math.round(
          Math.min(255, Math.max(0, (gSum / totalWeight) * alphaRatio)),
        )
        dstData[dstIdx + 2] = Math.round(
          Math.min(255, Math.max(0, (bSum / totalWeight) * alphaRatio)),
        )
        dstData[dstIdx + 3] = Math.round(Math.min(255, Math.max(0, finalA)))
      } else {
        dstData[dstIdx] = 0
        dstData[dstIdx + 1] = 0
        dstData[dstIdx + 2] = 0
        dstData[dstIdx + 3] = 0
      }
    }
  }

  return { width: targetW, height: targetH, data: dstData }
}

function crc32(buffer) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
      }
      table[i] = c
    }
  }

  let c = -1
  for (let i = 0; i < buffer.length; i++) {
    c = table[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ -1) >>> 0
}

function encodePNG(img) {
  const { width, height, data } = img
  const stride = width * 4
  const rawData = Buffer.alloc(height * (stride + 1))

  for (let y = 0; y < height; y++) {
    rawData[y * (stride + 1)] = 0 // Filter type: None
    data.copy(rawData, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 })

  function makeChunk(type, chunkData) {
    const len = chunkData ? chunkData.length : 0
    const buf = Buffer.alloc(12 + len)
    buf.writeUInt32BE(len, 0)
    buf.write(type, 4, 4, 'ascii')
    if (chunkData) chunkData.copy(buf, 8)
    const crc = crc32(buf.subarray(4, 8 + len))
    buf.writeUInt32BE(crc, 8 + len)
    return buf
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', null),
  ])
}

function createIco(pngBuffersWithSize) {
  // ICO file format with embedded PNG images
  const count = pngBuffersWithSize.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = ICO
  header.writeUInt16LE(count, 4) // Count

  const dirEntries = []
  let offset = 6 + count * 16

  for (const item of pngBuffersWithSize) {
    const dir = Buffer.alloc(16)
    dir[0] = item.size >= 256 ? 0 : item.size // Width
    dir[1] = item.size >= 256 ? 0 : item.size // Height
    dir[2] = 0 // Colors (0 = no palette)
    dir[3] = 0 // Reserved
    dir.writeUInt16LE(1, 4) // Color planes
    dir.writeUInt16LE(32, 6) // Bits per pixel
    dir.writeUInt32LE(item.png.length, 8) // Size of image data
    dir.writeUInt32LE(offset, 12) // Offset of image data
    dirEntries.push(dir)
    offset += item.png.length
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffersWithSize.map((i) => i.png)])
}

function main() {
  const srcPath = 'src/assets/projeto-labora-engenharia-e-sst-07-83499.png'
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source logo not found at ${srcPath}`)
  }

  const rawSrc = fs.readFileSync(srcPath)
  const decoded = decodePNG(rawSrc)
  console.log(`Loaded source image: ${decoded.width}x${decoded.height}`)

  // Generate 16, 32, 48, 180
  const img16 = resizeImage(decoded, 16, 16)
  const img32 = resizeImage(decoded, 32, 32)
  const img48 = resizeImage(decoded, 48, 48)
  const img180 = resizeImage(decoded, 180, 180)

  const png16 = encodePNG(img16)
  const png32 = encodePNG(img32)
  const png48 = encodePNG(img48)
  const png180 = encodePNG(img180)

  fs.writeFileSync('public/favicon-16.png', png16)
  fs.writeFileSync('public/favicon-32.png', png32)
  fs.writeFileSync('public/apple-touch-icon.png', png180)

  const icoBuffer = createIco([
    { size: 16, png: png16 },
    { size: 32, png: png32 },
    { size: 48, png: png48 },
  ])
  fs.writeFileSync('public/favicon.ico', icoBuffer)

  console.log(
    'Successfully generated public/favicon-16.png, favicon-32.png, apple-touch-icon.png, favicon.ico',
  )
}

main()
