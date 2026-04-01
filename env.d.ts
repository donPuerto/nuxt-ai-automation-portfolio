declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      request: Request
      env: {
        VIDEO_TO_TEXT_JOBS?: {
          get(key: string, type: 'json'): Promise<unknown | null>
          put(key: string, value: string): Promise<void>
        }
      }
      context: ExecutionContext
    }
  }
}

export {}
