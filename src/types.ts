export interface MetadataOptions {
  id?: string
  packname?: string
  publisher?: string
  emojis?: string[]
  androidPlayStoreLink?: string
  iosAppStoreLink?: string
  isFirstPartySticker?: boolean
}
export interface StickerOptions {
  width?: number
  height?: number
  bg?: string
  fps?: number
  quality?: number
  duration?: number
  crop?: boolean
  metadata?: MetadataOptions
}
