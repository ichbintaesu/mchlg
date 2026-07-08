import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'

export function sha256(value: string): string {
  return createHash('sha256').update(`${process.env.AUTH_SECRET}:${value}`).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export function encryptIp(ip: string): string {
  const key = Buffer.from(process.env.IP_ENC_KEY!, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(ip, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`
}

export function decryptIp(payload: string): string {
  const key = Buffer.from(process.env.IP_ENC_KEY!, 'hex')
  const [iv, tag, data] = payload.split('.')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8')
}

export function signAdminSession(expiresAt: number): string {
  const sig = createHmac('sha256', process.env.AUTH_SECRET!).update(String(expiresAt)).digest('hex')
  return `${expiresAt}.${sig}`
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false
  const [expiresAt, sig] = token.split('.')
  if (!expiresAt || !sig) return false
  if (Number(expiresAt) < Date.now()) return false
  const expected = createHmac('sha256', process.env.AUTH_SECRET!).update(expiresAt).digest('hex')
  return safeEqual(sig, expected)
}
