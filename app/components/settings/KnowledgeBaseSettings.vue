<script setup lang="ts">
import { toast } from 'vue-sonner'

type KnowledgeStatus = 'draft' | 'ready' | 'indexed' | 'failed'
type KnowledgeSourceType = 'text' | 'file'
type KnowledgeTab = 'all' | 'text' | 'files' | 'chunks'

type KnowledgeDocument = {
  id: string
  name: string
  source: string | null
  file_type: string | null
  source_type: KnowledgeSourceType
  file_name: string | null
  storage_path: string | null
  summary: string | null
  status: KnowledgeStatus
  created_at: string | null
  updated_at: string | null
  chunk_count: number
  preview: string
}

type KnowledgeChunk = {
  id: string
  document_id: string | null
  content: string
  chunk_index: number | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

type KnowledgeResponse = {
  documents: KnowledgeDocument[]
  chunks: KnowledgeChunk[]
}

const props = defineProps<{
  authenticated: boolean
}>()

const supabaseConfigured = useSupabaseConfigured()
const supabase = supabaseConfigured ? useSupabaseClient() : null

const documents = ref<KnowledgeDocument[]>([])
const chunks = ref<KnowledgeChunk[]>([])
const activeTab = ref<KnowledgeTab>('all')
const dialogOpen = ref(false)
const editingDocumentId = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const archiveId = ref<string | null>(null)

const form = reactive({
  sourceType: 'text' as KnowledgeSourceType,
  name: '',
  source: '',
  fileType: 'pdf',
  fileName: '',
  storagePath: '',
  summary: '',
  content: '',
})

const emptyStateCopy = computed(() => {
  if (activeTab.value === 'text') {
    return 'No text knowledge has been added yet.'
  }

  if (activeTab.value === 'files') {
    return 'No PDF or file knowledge has been synced yet.'
  }

  if (activeTab.value === 'chunks') {
    return 'No chunks are available yet. Add text knowledge or let n8n process a PDF.'
  }

  return 'No knowledge sources yet. Add a text note or connect your PDF pipeline.'
})

const publishedCount = computed(() => documents.value.filter(document => document.status === 'indexed').length)
const processingCount = computed(() => documents.value.filter(document => document.status === 'ready').length)
const failedCount = computed(() => documents.value.filter(document => document.status === 'failed').length)
const textCount = computed(() => documents.value.filter(document => document.source_type === 'text').length)
const fileCount = computed(() => documents.value.filter(document => document.source_type === 'file').length)
const chunkCount = computed(() => chunks.value.length)

const filteredDocuments = computed(() => {
  if (activeTab.value === 'text') {
    return documents.value.filter(document => document.source_type === 'text')
  }

  if (activeTab.value === 'files') {
    return documents.value.filter(document => document.source_type === 'file')
  }

  return documents.value
})

const resetForm = (sourceType: KnowledgeSourceType = 'text') => {
  editingDocumentId.value = null
  form.sourceType = sourceType
  form.name = ''
  form.source = ''
  form.fileType = sourceType === 'file' ? 'pdf' : 'text'
  form.fileName = ''
  form.storagePath = ''
  form.summary = ''
  form.content = ''
}

const getAuthHeaders = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('Please sign in to manage knowledge.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

const loadKnowledge = async () => {
  if (!props.authenticated) {
    documents.value = []
    chunks.value = []
    return
  }

  loading.value = true
  try {
    const headers = await getAuthHeaders()
    const result = await $fetch<KnowledgeResponse>('/api/knowledge/documents', {
      headers,
    })

    documents.value = result.documents
    chunks.value = result.chunks
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unable to load knowledge base.'
    toast.error('Knowledge base unavailable', { description })
  }
  finally {
    loading.value = false
  }
}

const openCreateDialog = (sourceType: KnowledgeSourceType) => {
  resetForm(sourceType)
  dialogOpen.value = true
}

const openEditDialog = (document: KnowledgeDocument) => {
  editingDocumentId.value = document.id
  form.sourceType = document.source_type
  form.name = document.name
  form.source = document.source ?? ''
  form.fileType = document.file_type ?? (document.source_type === 'file' ? 'pdf' : 'text')
  form.fileName = document.file_name ?? ''
  form.storagePath = document.storage_path ?? ''
  form.summary = document.summary ?? ''
  form.content = document.preview ?? ''
  dialogOpen.value = true
}

const saveDocument = async () => {
  if (saving.value) {
    return
  }

  saving.value = true
  try {
    const headers = await getAuthHeaders()
    const body = {
      name: form.name,
      source: form.source,
      sourceType: form.sourceType,
      fileType: form.fileType,
      fileName: form.fileName,
      storagePath: form.storagePath,
      summary: form.summary,
      content: form.content,
    }

    if (editingDocumentId.value) {
      await $fetch(`/api/knowledge/documents/${editingDocumentId.value}`, {
        method: 'PATCH',
        headers,
        body,
      })
    }
    else {
      await $fetch('/api/knowledge/documents', {
        method: 'POST',
        headers,
        body,
      })
    }

    dialogOpen.value = false
    await loadKnowledge()
    toast.success('Knowledge updated', {
      description: editingDocumentId.value ? 'The source was updated.' : 'The source was added.',
    })
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unable to save knowledge source.'
    toast.error('Save failed', { description })
  }
  finally {
    saving.value = false
  }
}

const archiveDocument = async (document: KnowledgeDocument) => {
  archiveId.value = document.id
  try {
    const headers = await getAuthHeaders()
    await $fetch(`/api/knowledge/documents/${document.id}`, {
      method: 'PATCH',
      headers,
      body: {
        name: document.name,
        source: document.source,
        sourceType: document.source_type,
        fileType: document.file_type,
        fileName: document.file_name,
        storagePath: document.storage_path,
        summary: document.summary,
        content: document.preview,
        status: 'draft',
      },
    })
    await loadKnowledge()
    toast.success('Knowledge archived', {
      description: 'The source was moved back to draft.',
    })
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unable to archive this source.'
    toast.error('Archive failed', { description })
  }
  finally {
    archiveId.value = null
  }
}

const deleteDocument = async (document: KnowledgeDocument) => {
  if (!window.confirm(`Delete "${document.name}" from the knowledge base?`)) {
    return
  }

  deletingId.value = document.id
  try {
    const headers = await getAuthHeaders()
    await $fetch(`/api/knowledge/documents/${document.id}`, {
      method: 'DELETE',
      headers,
    })
    await loadKnowledge()
    toast.success('Knowledge deleted', {
      description: 'The source and its chunks were removed.',
    })
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unable to delete this source.'
    toast.error('Delete failed', { description })
  }
  finally {
    deletingId.value = null
  }
}

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const statusTone = (status: KnowledgeStatus) => {
  if (status === 'indexed') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
  }

  if (status === 'failed') {
    return 'border-red-400/20 bg-red-400/10 text-red-200'
  }

  if (status === 'ready') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-100'
  }

  return 'border-[#4a433d] bg-[#221f1d] text-[#ab9986]'
}

onMounted(() => {
  void loadKnowledge()
})

watch(
  () => props.authenticated,
  () => {
    void loadKnowledge()
  },
)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-[#fff4e6]">
          Knowledge Base
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-[#ab9986]">
          Manage the text and PDF sources that feed your RAG system. PDF processing can stay in n8n, while manual notes can be edited here.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          class="h-8 border-[#4a433d] bg-[#221f1d] px-3 text-xs text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
          @click="openCreateDialog('file')"
        >
          <Icon name="lucide:file-up" class="mr-1.5 size-3.5" />
          Add PDF
        </Button>
        <Button
          class="h-8 bg-[#b87449] px-3 text-xs text-white hover:bg-[#c6845a]"
          @click="openCreateDialog('text')"
        >
          <Icon name="lucide:plus" class="mr-1.5 size-3.5" />
          Add text
        </Button>
      </div>
    </div>

    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3">
        <div class="text-[11px] font-medium tracking-[0.14em] text-[#8f857a] uppercase">
          Indexed
        </div>
        <div class="mt-2 text-2xl font-semibold text-[#fff4e6]">
          {{ publishedCount }}
        </div>
      </div>
      <div class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3">
        <div class="text-[11px] font-medium tracking-[0.14em] text-[#8f857a] uppercase">
          Ready
        </div>
        <div class="mt-2 text-2xl font-semibold text-[#fff4e6]">
          {{ processingCount }}
        </div>
      </div>
      <div class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3">
        <div class="text-[11px] font-medium tracking-[0.14em] text-[#8f857a] uppercase">
          Text / Files
        </div>
        <div class="mt-2 text-2xl font-semibold text-[#fff4e6]">
          {{ textCount }} / {{ fileCount }}
        </div>
      </div>
      <div class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3">
        <div class="text-[11px] font-medium tracking-[0.14em] text-[#8f857a] uppercase">
          Chunks
        </div>
        <div class="mt-2 text-2xl font-semibold text-[#fff4e6]">
          {{ chunkCount }}
        </div>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="h-9 bg-[#221f1d] p-1">
        <TabsTrigger value="all" class="h-7 px-3 text-xs">
          All
        </TabsTrigger>
        <TabsTrigger value="text" class="h-7 px-3 text-xs">
          Text
        </TabsTrigger>
        <TabsTrigger value="files" class="h-7 px-3 text-xs">
          PDFs
        </TabsTrigger>
        <TabsTrigger value="chunks" class="h-7 px-3 text-xs">
          Chunks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chunks" class="mt-4">
        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="index in 3" :key="index" class="h-16 bg-[#3a342f]" />
        </div>
        <div v-else-if="chunks.length === 0" class="rounded-xl border border-dashed border-[#4a433d]/70 bg-[#221f1d]/60 p-6 text-sm text-[#ab9986]">
          {{ emptyStateCopy }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="chunk in chunks"
            :key="chunk.id"
            class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3"
          >
            <div class="flex items-center justify-between gap-3 text-[11px] text-[#8f857a]">
              <span>Chunk {{ chunk.chunk_index ?? 0 }}</span>
              <span>{{ formatDate(chunk.created_at) }}</span>
            </div>
            <p class="mt-2 line-clamp-3 text-sm leading-6 text-[#f0deca]">
              {{ chunk.content }}
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="all" class="mt-4">
        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="index in 4" :key="index" class="h-20 bg-[#3a342f]" />
        </div>
        <div v-else-if="filteredDocuments.length === 0" class="rounded-xl border border-dashed border-[#4a433d]/70 bg-[#221f1d]/60 p-6 text-sm text-[#ab9986]">
          {{ emptyStateCopy }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="document in filteredDocuments"
            :key="document.id"
            class="group rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3 transition hover:border-[#6a5a4c]/80 hover:bg-[#2d2926]"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <Icon
                    :name="document.source_type === 'file' ? 'lucide:file-text' : 'lucide:notebook-text'"
                    class="size-4 text-[#d47f55]"
                  />
                  <h3 class="truncate text-sm font-semibold text-[#fff4e6]">
                    {{ document.name }}
                  </h3>
                  <span
                    class="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                    :class="statusTone(document.status)"
                  >
                    {{ document.status }}
                  </span>
                </div>
                <p class="mt-2 line-clamp-2 text-sm leading-6 text-[#ab9986]">
                  {{ document.summary || document.preview || 'No summary yet.' }}
                </p>
                <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8f857a]">
                  <span>{{ document.source_type === 'file' ? (document.file_type || 'file').toUpperCase() : 'TEXT' }}</span>
                  <span>{{ document.chunk_count }} chunks</span>
                  <span>Updated {{ formatDate(document.updated_at) }}</span>
                  <span v-if="document.file_name">{{ document.file_name }}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 shrink-0 text-[#ab9986] hover:bg-[#221f1d] hover:text-[#fff4e6]"
                  >
                    <Icon name="lucide:more-horizontal" class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-36 border-[#4a433d] bg-[#2b2724] text-[#f0deca]">
                  <DropdownMenuItem class="text-xs focus:bg-[#221f1d] focus:text-[#fff4e6]" @select="openEditDialog(document)">
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-xs focus:bg-[#221f1d] focus:text-[#fff4e6]"
                    :disabled="archiveId === document.id"
                    @select="archiveDocument(document)"
                  >
                    Move to draft
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-xs text-red-200 focus:bg-red-950/40 focus:text-red-100"
                    :disabled="deletingId === document.id"
                    @select="deleteDocument(document)"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="text" class="mt-4">
        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="index in 3" :key="index" class="h-20 bg-[#3a342f]" />
        </div>
        <div v-else-if="filteredDocuments.length === 0" class="rounded-xl border border-dashed border-[#4a433d]/70 bg-[#221f1d]/60 p-6 text-sm text-[#ab9986]">
          {{ emptyStateCopy }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="document in filteredDocuments"
            :key="document.id"
            class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-[#fff4e6]">
                  {{ document.name }}
                </h3>
                <p class="mt-1 line-clamp-2 text-sm leading-6 text-[#ab9986]">
                  {{ document.preview || document.summary || 'No content preview.' }}
                </p>
              </div>
              <Button variant="ghost" class="h-8 px-2 text-xs text-[#f0deca] hover:bg-[#221f1d]" @click="openEditDialog(document)">
                Edit
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="files" class="mt-4">
        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="index in 3" :key="index" class="h-20 bg-[#3a342f]" />
        </div>
        <div v-else-if="filteredDocuments.length === 0" class="rounded-xl border border-dashed border-[#4a433d]/70 bg-[#221f1d]/60 p-6 text-sm text-[#ab9986]">
          {{ emptyStateCopy }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="document in filteredDocuments"
            :key="document.id"
            class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-[#fff4e6]">
                  {{ document.name }}
                </h3>
                <p class="mt-1 truncate text-sm text-[#ab9986]">
                  {{ document.storage_path || document.file_name || 'Waiting for n8n file path.' }}
                </p>
              </div>
              <Button variant="ghost" class="h-8 px-2 text-xs text-[#f0deca] hover:bg-[#221f1d]" @click="openEditDialog(document)">
                Edit
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="border-[#4a433d] bg-[#2b2724] text-[#f0deca] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {{ editingDocumentId ? 'Edit knowledge source' : 'Add knowledge source' }}
          </DialogTitle>
          <DialogDescription class="text-[#ab9986]">
            Add text directly or register a PDF/file that n8n will process into chunks.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <Tabs v-model="form.sourceType">
            <TabsList class="h-9 bg-[#221f1d] p-1">
              <TabsTrigger value="text" class="h-7 px-3 text-xs">
                Text
              </TabsTrigger>
              <TabsTrigger value="file" class="h-7 px-3 text-xs">
                PDF/File
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <Label for="knowledge-name">Title</Label>
              <Input id="knowledge-name" v-model="form.name" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" placeholder="e.g. Don Puerto portfolio background" />
            </div>
            <div class="space-y-2">
              <Label for="knowledge-source">Source</Label>
              <Input id="knowledge-source" v-model="form.source" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" placeholder="manual, Google Drive, n8n..." />
            </div>
            <div class="space-y-2">
              <Label for="knowledge-summary">Short summary</Label>
              <Input id="knowledge-summary" v-model="form.summary" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" placeholder="What this knowledge is for" />
            </div>
          </div>

          <div v-if="form.sourceType === 'file'" class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="knowledge-file-name">File name</Label>
              <Input id="knowledge-file-name" v-model="form.fileName" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" placeholder="portfolio.pdf" />
            </div>
            <div class="space-y-2">
              <Label for="knowledge-storage-path">Storage path</Label>
              <Input id="knowledge-storage-path" v-model="form.storagePath" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" placeholder="knowledge/portfolio.pdf" />
            </div>
          </div>

          <div v-else class="space-y-2">
            <Label for="knowledge-content">Content</Label>
            <Textarea
              id="knowledge-content"
              v-model="form.content"
              rows="7"
              class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6] placeholder:text-[#8f857a]"
              placeholder="Paste the knowledge Claude should use about you, your projects, workflows, or services..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
            @click="dialogOpen = false"
          >
            Cancel
          </Button>
          <Button
            class="bg-[#b87449] text-white hover:bg-[#c6845a]"
            :disabled="saving"
            @click="saveDocument"
          >
            {{ saving ? 'Saving...' : 'Save source' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
