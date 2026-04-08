export const removeRandomSuffix = (filename: string) => {
  return filename.replace(/-[a-z0-9]{5,}(?=\.[^./\\]+$|$)/i, '')
}

export const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return 'lucide:file'
  if (mimeType.startsWith('image/')) return 'lucide:image'
  if (mimeType.includes('pdf')) return 'lucide:file-text'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'lucide:file-archive'
  if (mimeType.includes('video')) return 'lucide:file-video'
  if (mimeType.includes('audio')) return 'lucide:file-audio'
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript')) return 'lucide:file-code-2'
  return 'lucide:file'
}
