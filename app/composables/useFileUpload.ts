import type { ChatFileWithStatus } from '@/components/chat/chat-types'

export type FileWithStatus = ChatFileWithStatus

const createFileItem = (file: File, index = 0): FileWithStatus => ({
  id: `${file.name}-${file.size}-${Date.now()}-${index}`,
  file,
  previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  status: 'ready',
})

export function useFileUpload() {
  const dropzoneRef = ref<HTMLElement | null>(null)
  const files = ref<FileWithStatus[]>([])
  const dragging = ref(false)

  const addFiles = (newFiles: File[]) => {
    const mapped = newFiles.map((file, index) => createFileItem(file, index))
    files.value = [...files.value, ...mapped]
  }

  const removeFile = (id: string) => {
    const match = files.value.find(file => file.id === id)
    if (match?.previewUrl) {
      URL.revokeObjectURL(match.previewUrl)
    }
    files.value = files.value.filter(file => file.id !== id)
  }

  const clearFiles = () => {
    for (const file of files.value) {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
    }
    files.value = []
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    dragging.value = true
  }

  const onDragLeave = (event: DragEvent) => {
    const current = dropzoneRef.value
    if (!current) {
      dragging.value = false
      return
    }

    if (event.relatedTarget instanceof Node && current.contains(event.relatedTarget)) {
      return
    }

    dragging.value = false
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    dragging.value = false
    const droppedFiles = Array.from(event.dataTransfer?.files ?? [])
    if (droppedFiles.length) {
      addFiles(droppedFiles)
    }
  }

  onMounted(() => {
    const node = dropzoneRef.value
    if (!node) return
    node.addEventListener('dragover', onDragOver)
    node.addEventListener('dragleave', onDragLeave)
    node.addEventListener('drop', onDrop)
  })

  onBeforeUnmount(() => {
    const node = dropzoneRef.value
    if (node) {
      node.removeEventListener('dragover', onDragOver)
      node.removeEventListener('dragleave', onDragLeave)
      node.removeEventListener('drop', onDrop)
    }
    clearFiles()
  })

  return {
    dropzoneRef,
    dragging,
    files,
    addFiles,
    removeFile,
    clearFiles,
  }
}
