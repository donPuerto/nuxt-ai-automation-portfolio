import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogProject } from '@@/shared/catalog/types'
import { catalogProjects } from '@@/shared/catalog/projects'
import { getCategoryBySlug } from '@@/shared/catalog'
import { buildKnowledgeSummary, replaceDocumentChunks } from './knowledge-indexing'

export const PROJECT_CATALOG_SOURCE = 'project-catalog'

type SyncConfig = {
  openaiApiKey?: string | null
}

type SyncResult = {
  slug: string
  title: string
  action: 'created' | 'updated' | 'skipped'
  documentId: string
}

type SyncReport = {
  synced: number
  created: number
  updated: number
  skipped: number
  results: SyncResult[]
}

// Build a rich, searchable knowledge text from a CatalogProject
export const buildProjectKnowledgeContent = (project: CatalogProject): string => {
  const category = getCategoryBySlug(project.category)
  const categoryLabel = category?.title ?? project.category
  const platforms = project.platforms.join(', ')

  const lines: string[] = [
    `# ${project.title}`,
    '',
    `**Category:** ${categoryLabel}`,
    `**Primary Platform:** ${project.primaryPlatform}`,
    `**Platforms / Tools:** ${platforms}`,
    `**Price:** ${project.priceLabel}`,
    `**Target Audience:** ${project.audience}`,
    '',
    '## Summary',
    project.summary,
    '',
    '## Business Outcome',
    project.businessOutcome,
    '',
    '## Problem it solves',
    project.problem,
    '',
    '## Solution',
    project.solution,
    '',
    '## How the workflow works',
    ...project.workflowOverview.map(step => `- ${step}`),
    '',
    '## What you get',
    ...project.deliverables.map(item => `- ${item}`),
    '',
    '## Expected results',
    ...project.resultsOrExpectedOutcome.map(item => `- ${item}`),
  ]

  return lines.join('\n').trim()
}

// Find an existing project-catalog document by slug
const findExistingProjectDoc = async (
  supabase: SupabaseClient,
  slug: string,
): Promise<{ id: string } | null> => {
  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('source', PROJECT_CATALOG_SOURCE)
    .eq('file_name', slug)
    .limit(1)
    .single()

  return data ?? null
}

// Upsert a single project into the knowledge base
export const syncProjectToKnowledge = async (
  project: CatalogProject,
  supabase: SupabaseClient,
  config: SyncConfig,
): Promise<SyncResult> => {
  const content = buildProjectKnowledgeContent(project)
  const summary = buildKnowledgeSummary(content)
  const existing = await findExistingProjectDoc(supabase, project.slug)

  let documentId: string
  let action: SyncResult['action']

  if (existing) {
    const { error } = await supabase
      .from('documents')
      .update({
        name: project.title,
        summary,
        status: 'indexed',
      })
      .eq('id', existing.id)

    if (error) throw new Error(`Failed to update doc for ${project.slug}: ${error.message}`)
    documentId = existing.id
    action = 'updated'
  }
  else {
    documentId = crypto.randomUUID()
    const { error } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        name: project.title,
        source: PROJECT_CATALOG_SOURCE,
        source_type: 'text',
        file_type: 'text',
        file_name: project.slug,
        summary,
        status: 'indexed',
      })

    if (error) throw new Error(`Failed to insert doc for ${project.slug}: ${error.message}`)
    action = 'created'
  }

  await replaceDocumentChunks({
    supabase,
    documentId,
    content,
    sourceType: 'text',
    fileName: project.slug,
    options: { openaiApiKey: config.openaiApiKey },
  })

  return { slug: project.slug, title: project.title, action, documentId }
}

// Sync every project in the catalog
export const syncAllProjectsToKnowledge = async (
  supabase: SupabaseClient,
  config: SyncConfig,
): Promise<SyncReport> => {
  const results: SyncResult[] = []
  let created = 0
  let updated = 0
  let skipped = 0

  for (const project of catalogProjects) {
    try {
      const result = await syncProjectToKnowledge(project, supabase, config)
      results.push(result)
      if (result.action === 'created') created++
      else if (result.action === 'updated') updated++
      else skipped++
    }
    catch (err) {
      console.error(`[project-sync] failed for ${project.slug}:`, err)
      results.push({ slug: project.slug, title: project.title, action: 'skipped', documentId: '' })
      skipped++
    }
  }

  return { synced: created + updated, created, updated, skipped, results }
}

// Delete a project's knowledge document by slug
export const deleteProjectKnowledge = async (
  supabase: SupabaseClient,
  slug: string,
): Promise<boolean> => {
  const existing = await findExistingProjectDoc(supabase, slug)
  if (!existing) return false

  await supabase.from('document_chunks').delete().eq('document_id', existing.id)
  const { error } = await supabase.from('documents').delete().eq('id', existing.id)
  if (error) throw new Error(error.message)
  return true
}

export { catalogProjects }
