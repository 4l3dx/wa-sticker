import crypto from 'crypto'
import type { MetadataOptions, StickerOptions } from './types'
import { readFile, access } from 'fs/promises'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { exec } from 'child_process'
import { defaultSticker } from './constants'

/**
  * Generate a random id.
  * @returns {string} The random id.
*/
export const randomId = (): string => crypto.randomBytes(16).toString('hex')

/**
 * It returns a random file path in the system's temporary directory
 * @param {string} ext - The file extension.
 */
export const tempFile = (ext: string): string => `${join(tmpdir(), randomId())}.${ext}`

/**
  * Create a JSON string from an object.
  * @param {Object} options - The object to convert to a JSON string.
  * @returns {String} The JSON string.
*/
export const objToJSON = (options: MetadataOptions): string => {
  return JSON.stringify({
    'sticker-pack-id': options.id ?? randomId(),
    'sticker-pack-name': options.packname ?? 'MySticker',
    'sticker-pack-publisher': options.publisher ?? 'StickerMaker',
    emojis: options.emojis,
    'android-app-store-link': options.androidPlayStoreLink,
    'ios-app-store-link': options.iosAppStoreLink,
    'is-first-party-sticker': options.isFirstPartySticker
  })
}

/**
  * Get length of a string in bytes.
  * @param {string} str - The string to get the length of.
  * @returns {number} The length of the string in bytes.
*/
export const getStringLength = (str: string): number => {
  const len = Buffer.byteLength(str, 'utf-8')
  return len % 2 === 0 ? len : len + 1
}

function ffmpegScale (input: string[], width: number, height: number, bg: string, fps: number): string {
  const str = [] as string[]
  input.forEach((_file, index) => {
    const filter = `[${index}:v]`
    let pad = index === 0 ? `,format=rgba,pad=512:512:-1:-1:${bg},setsar=1` : `[v${index}]`
    if (index === 0 && input.length > 1) pad += '[padded]'
    str.push(`${filter}fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=decrease${pad}`)
  })
  return str.join(';')
}

async function cropInput (input: string, width: number, height: number): Promise<string> {
  const ext = (await import('path')).extname(input)
  const output = tempFile(ext)
  const cmd = `ffmpeg -y -i ${input} -filter_complex "crop=min(min(iw\\,ih)\\,${width}):min(min(iw\\,ih)\\,${height})" ${output}`
  return await new Promise((resolve, reject) => {
    exec(cmd).on('exit', (code) => {
      if (code !== 0) throw new Error('ffmpeg failed')
    }).on('error', (err) => {
      reject(err)
    }).on('close', () => {
      return resolve(output)
    })
  })
}

function ffmpegOverlay (input: string[]): string {
  const len = input.length - 1
  const str = [] as string[]
  input.forEach((_file, index) => {
    if (index > len) return
    if (index === 0) {
      str.push('[padded]')
    } else {
      str.push((`[v${index}]`))
    }
  })
  str.push('overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2')
  return str.join('')
}

async function ffmpegInput (file: string[]): Promise<string> {
  // Validate input
  if (file.length < 1) throw new Error('No input files provided')
  for (const f of file) {
    await access(resolve(f), 0)
      .catch((_err) => {
        throw new Error(`Input file ${f} does not exist`)
      })
  }
  const str = [] as string[]
  file.forEach((file) => {
    str.push(`-i ${file}`)
  })
  return str.join(' ')
}

/**
 * @param {string[]} input - string[] - An array of paths to the images you want to use.
 * @param {string} output - The output file name
 * @param {StickerOptions} options - StickerOptions
 * @returns A buffer of the output file.
 */
export const ffmpeg = async (input: string[], output: string, options?: StickerOptions): Promise<Buffer> => {
  const { width, height, bg, fps, duration, quality, crop } = { ...defaultSticker, ...options }
  const len = input.length
  if (crop) input[0] = await cropInput(input[0], 512, 512)
  const inputStr = await ffmpegInput(input)
  const scaleStr = ffmpegScale(input, width, height, bg, fps)
  const overlayStr = ffmpegOverlay(input)
  const cmd = `ffmpeg -y ${inputStr} -vcodec libwebp -loop 0 -t ${duration} -q:v ${quality} -filter_complex "${scaleStr}${len > 1 ? ';' + overlayStr : ''}"  ${output}`
  return await new Promise((resolve, reject) => {
    exec(cmd).on('exit', (code) => {
      if (code !== 0) throw new Error('ffmpeg failed')
    }).on('error', (err) => {
      reject(err)
    }).on('close', () => {
      return resolve(readFile(output))
    })
  })
}
