/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any)
    internal: {
      pageSize: {
        getWidth(): number
        getHeight(): number
      }
    }
    setFillColor(r: number, g: number, b: number): void
    setDrawColor(r: number, g: number, b: number): void
    setLineWidth(width: number): void
    setTextColor(r: number, g: number, b?: number): void
    setFontSize(size: number): void
    setFont(font: string, style?: string): void
    rect(x: number, y: number, w: number, h: number, style?: string): void
    circle(x: number, y: number, r: number, style?: string): void
    ellipse(x: number, y: number, rx: number, ry: number, style?: string): void
    line(x1: number, y1: number, x2: number, y2: number): void
    text(text: string | string[], x: number, y: number, options?: any): void
    getTextWidth(text: string): number
    splitTextToSize(text: string, maxWidth: number): string[]
    addImage(imageData: string, format: string, x: number, y: number, w: number, h: number, alias?: string, compression?: string): void
    addPage(): void
    setPage(page: number): void
    getNumberOfPages(): number
    save(filename: string): void
    output(type: string): Blob
  }
}

declare global {
  interface Window {
    spark: {
      llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
      llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
      user: () => Promise<{
        avatarUrl: string
        email: string
        id: string
        isOwner: boolean
        login: string
      }>
      kv: {
        keys: () => Promise<string[]>
        get: <T>(key: string) => Promise<T | undefined>
        set: <T>(key: string, value: T) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }

  const spark: Window['spark']
}