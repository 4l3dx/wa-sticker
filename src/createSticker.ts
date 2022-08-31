import { defaultSticker } from './constants'
import { setMetadata } from './metadata'
import type { MetadataOptions, StickerOptions } from './types'
import { ffmpeg, tempFile } from './utils'

/**
 * @param {string[]} file - string[] - The file to convert to a sticker.
 * @param {StickerOptions} options - StickerOptions = defaultSticker
 * @returns A Buffer
 */
export async function createSticker (file: string[], options?: StickerOptions): Promise<Buffer> {
  options = { ...defaultSticker, ...options }
  const { metadata } = options
  const output = tempFile('webp')
  const buffer = await ffmpeg(file, output, options).catch((err) => {
    throw new Error(err.message)
  })
  const bufMetadata = setMetadata(buffer, metadata as MetadataOptions)
  return bufMetadata
}
