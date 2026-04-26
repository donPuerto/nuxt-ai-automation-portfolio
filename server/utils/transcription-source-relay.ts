import { createHmac, timingSafeEqual } from 'node:crypto'

const RELAY_TTL_SECONDS = 60 * 30

const normalizeOrigin = (value: string) => value.replace(/\/+$/, '')

const buildRelayPayload = (fileId: string, expiresAt: number) => `${fileId}:${expiresAt}`

const signRelayPayload = (payload: string, secret: string) => {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export const getTranscriptionSourceRelayTtl = () => RELAY_TTL_SECONDS

export const buildTranscriptionSourceRelayUrl = ({
  origin,
  fileId,
  secret,
  expiresIn = RELAY_TTL_SECONDS,
}: {
  origin: string
  fileId: string
  secret: string
  expiresIn?: number
}) => {
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(30, expiresIn)
  const payload = buildRelayPayload(fileId, expiresAt)
  const token = signRelayPayload(payload, secret)
  const url = new URL(`${normalizeOrigin(origin)}/api/tools/video-to-text/files/${fileId}/source`)

  url.searchParams.set('expires', String(expiresAt))
  url.searchParams.set('token', token)

  return url.toString()
}

export const verifyTranscriptionSourceRelayAccess = ({
  fileId,
  expiresAtRaw,
  token,
  secret,
}: {
  fileId: string
  expiresAtRaw: string
  token: string
  secret: string
}) => {
  const expiresAt = Number.parseInt(expiresAtRaw, 10)
  if (!Number.isFinite(expiresAt)) {
    return false
  }

  if (expiresAt < Math.floor(Date.now() / 1000)) {
    return false
  }

  const payload = buildRelayPayload(fileId, expiresAt)
  const expectedToken = signRelayPayload(payload, secret)

  return safeEqual(expectedToken, token)
}
