import type { MetadataOptions } from './types'
import { objToJSON, getStringLength } from './utils'

/**
  * Set metadata for the webp file.
  * @param {Buffer} file - The sticker file.
  * @param {Metadata} options - The metadata to set.
  * @returns {Buffer} The sticker file with the metadata set.
  *
*/
export const setMetadata = (file: Buffer, options: MetadataOptions): Buffer => {
  file = removeMetadata(file)
  const offset = (num: number): number => { return num + file.byteLength }
  const metadata = objToJSON(options)
  const metadataLen = getStringLength(metadata)
  const exifLen = 30 + metadataLen // 30 is the length of the exif header
  const exif = Buffer.alloc(file.byteLength + exifLen)
  file.copy(exif, 0, 0, file.byteLength)
  // Header
  exif.write('EXIF', offset(0))
  exif.writeUInt32LE(exifLen - 8, offset(4))

  // Intel endianess
  exif.writeUInt32LE(0x002a4949, offset(8))
  // Motorola endianess
  // buf.writeUInt32LE(0x002a4d4d, offset(8))

  // IDF0
  exif.writeUInt32LE(0x00000008, offset(12))
  exif.writeUInt16LE(0x0001, offset(16))

  // Sticker metadata
  exif.writeUInt32LE(0x00075741, offset(18))
  exif.writeUInt32LE(metadataLen, offset(22))
  exif.writeUInt32LE(0x00000016, offset(26))
  exif.write(metadata, offset(30), 'utf-8')

  // New size + metadata length
  exif.writeUInt32LE(exif.byteLength - 8, 4) // -8 is the length of the webp header

  return exif
}

/**
 * It removes the metadata from the file
 * @param {Buffer} file - Buffer - The file to remove metadata from
 * @returns A Buffer
 */
export const removeMetadata = (file: Buffer): Buffer => {
  file.forEach((byte, index) => {
    if (byte !== 0x45) return
    if (file[index + 1] !== 0x58) return
    if (file[index + 2] !== 0x49) return
    if (file[index + 3] !== 0x46) return
    file = file.subarray(0, index)
  })

  return file
}

/**
 * It takes a buffer and return metadata
 * @param {Buffer} file - Buffer - the file buffer
 * @returns The metadata object.
 */
export const getMetadata = (file: Buffer): MetadataOptions => {
  const metadata = removeMetadata(file)
  const metadataLen = metadata.readUInt32LE(22)
  const metadataStr = metadata.toString('utf-8', 30, 30 + metadataLen)
  const metadataObj = JSON.parse(metadataStr)
  return metadataObj
}
