export interface ResampleOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export async function resampleImage(
  dataUrl: string,
  options: ResampleOptions = {}
): Promise<{ resampled: string }> {
  const {
    maxWidth = 600,
    maxHeight = 480,
    quality = 0.85,
    format = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width <= maxWidth && height <= maxHeight) {
        resolve({ resampled: dataUrl })
        return
      }

      const aspectRatio = width / height
      
      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }
      
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)
      
      const ctx = canvas.getContext('2d', {
        alpha: format === 'image/png',
        desynchronized: true,
        willReadFrequently: false
      })
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0, width, height)

      const resampled = canvas.toDataURL(format, quality)
      
      resolve({
        resampled: resampled
      })
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = dataUrl
  })
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = dataUrl
  })
}

export function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1]
  if (!base64) return 0
  
  const padding = (base64.match(/=/g) || []).length
  return (base64.length * 0.75) - padding
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
