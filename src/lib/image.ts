/** Image helpers: downscale + encode to a compact JPEG data URL for the AI. */

const MAX_DIM = 1024
const QUALITY = 0.82

/** Draw an image source onto a canvas, capped at MAX_DIM, return a JPEG data URL. */
function encode(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_DIM / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D canvas context')
  ctx.drawImage(source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

/** Capture the current frame of a playing <video> as a JPEG data URL. */
export function captureVideoFrame(video: HTMLVideoElement): string {
  return encode(video, video.videoWidth, video.videoHeight)
}

/** Read a user-selected image File into a downscaled JPEG data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.onload = () => {
        try {
          resolve(encode(img, img.naturalWidth, img.naturalHeight))
        } catch (e) {
          reject(e)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
