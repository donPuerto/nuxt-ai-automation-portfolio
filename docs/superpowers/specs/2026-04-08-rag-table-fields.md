# RAG Table Fields (PDF + n8n Flow)

## Purpose

This document defines the table-field structure for a personal RAG system where:

- PDF files are uploaded and processed by n8n
- metadata is stored in `public.documents`
- chunks + embeddings are stored in `public.document_chunks`
- retrieval is limited to `about_me` content

## Table: `public.documents`

| Field | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key for the document |
| `owner_id` | `uuid` | Yes (recommended No for new data) | - | Owner user id, FK to `public.profiles(id)` |
| `name` | `text` | No | - | Human-readable document title |
| `source` | `text` | Yes | - | Original source identifier (optional) |
| `file_type` | `text` | Yes | - | Original file type (legacy/optional) |
| `scope` | `text` | No | `'about_me'` | Content scope; restricted to personal RAG scope |
| `status` | `text` | No | `'published'` | Processing state (`draft`, `processing`, `published`, `failed`, `archived`) |
| `storage_path` | `text` | Yes | - | Path to the source PDF in storage |
| `source_type` | `text` | No | `'pdf'` | Source category (`pdf`, `txt`, `md`, `html`, `manual`) |
| `metadata` | `jsonb` | No | `'{}'::jsonb` | Extended metadata (page count, tags, hash, etc.) |
| `created_at` | `timestamptz` | No | `now()` | Record creation time |
| `updated_at` | `timestamptz` | No | `now()` | Record update time (trigger-managed) |

## Table: `public.document_chunks`

| Field | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key for chunk row |
| `document_id` | `uuid` | No | - | FK to `public.documents(id)` |
| `content` | `text` | No | - | Chunk text content |
| `embedding` | `vector` | Yes | - | Embedding vector used for similarity search |
| `chunk_index` | `integer` | No | `0` | Ordered chunk position per document |
| `metadata` | `jsonb` | No | `'{}'::jsonb` | Chunk metadata (page, token count, section, etc.) |
| `created_at` | `timestamptz` | No | `now()` | Chunk creation time |

## Constraints and Indexes (Recommended)

### `public.documents`

- PK: `id`
- FK: `owner_id -> public.profiles(id)` (`ON DELETE CASCADE`)
- Check: `scope in ('about_me')`
- Check: `status in ('draft', 'processing', 'published', 'failed', 'archived')`
- Check: `source_type in ('pdf', 'txt', 'md', 'html', 'manual')`
- Index: `(owner_id, scope, status, created_at desc)`

### `public.document_chunks`

- PK: `id`
- FK: `document_id -> public.documents(id)` (`ON DELETE CASCADE`)
- Unique: `(document_id, chunk_index)`
- Index: `(document_id, chunk_index)`
- Vector index: `ivfflat (embedding vector_cosine_ops)` for semantic retrieval

## RLS Model

- `service_role`: full read/write on both tables (for n8n ingestion pipeline)
- `authenticated`: owner-only read access
- retrieval scope restricted to `about_me` and `published` documents

## n8n Write Mapping

### When a PDF is received

Insert/Upsert in `public.documents`:

- `owner_id`
- `name`
- `scope = 'about_me'`
- `status = 'processing'` then `'published'` after chunking
- `storage_path`
- `source_type = 'pdf'`
- `metadata` (optional JSON details)

### When chunks are generated

Insert in `public.document_chunks`:

- `document_id`
- `chunk_index`
- `content`
- `embedding`
- `metadata`

## Retrieval Rule

Only query chunks joined to documents where:

- `documents.owner_id = auth.uid()`
- `documents.scope = 'about_me'`
- `documents.status = 'published'`

