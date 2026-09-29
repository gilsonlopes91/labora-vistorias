import fs from 'node:fs'

const buf = fs.readFileSync('src/assets/projeto-labora-engenharia-e-sst-07-83499.png')
const width = buf.readUInt32BE(16)
const height = buf.readUInt32BE(20)
const colorType = buf[25]
const bitDepth = buf[24]
const icoBuf = fs.readFileSync('public/favicon.ico')

fs.writeFileSync(
  'scripts/output.txt',
  `PNG: ${width}x${height}, colorType=${colorType}, bitDepth=${bitDepth}, length=${buf.length}\nICO: ${icoBuf.length} bytes\n`,
)
