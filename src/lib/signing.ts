import type { SignatureRecord } from '../features/practice/types'

const encoder = new TextEncoder()

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

export const sha256Hex = async (message: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(message))
  return toHex(new Uint8Array(digest))
}

export const signMarkdown = async (
  message: string,
  signerName: string,
): Promise<SignatureRecord> => {
  const [ed, hashes] = await Promise.all([
    import('@noble/ed25519'),
    import('@noble/hashes/sha2.js'),
  ])
  ed.hashes.sha512 = hashes.sha512
  ed.hashes.sha512Async = (value) => Promise.resolve(hashes.sha512(value))

  const secretKey = crypto.getRandomValues(new Uint8Array(32))
  const publicKey = await ed.getPublicKeyAsync(secretKey)
  const signature = await ed.signAsync(encoder.encode(message), secretKey)
  const payloadHash = await sha256Hex(message)
  const verified = await ed.verifyAsync(signature, encoder.encode(message), publicKey)

  return {
    algorithm: 'Ed25519',
    signedAt: new Date().toISOString(),
    signerName,
    publicKey: toHex(publicKey),
    signature: toHex(signature),
    payloadHash,
    verified,
  }
}

export const verifyMarkdownSignature = async (message: string, signature: SignatureRecord) => {
  const [ed, hashes] = await Promise.all([
    import('@noble/ed25519'),
    import('@noble/hashes/sha2.js'),
  ])
  ed.hashes.sha512 = hashes.sha512
  ed.hashes.sha512Async = (value) => Promise.resolve(hashes.sha512(value))

  const hashMatches = (await sha256Hex(message)) === signature.payloadHash
  const validSignature = await ed.verifyAsync(
    fromHex(signature.signature),
    encoder.encode(message),
    fromHex(signature.publicKey),
  )

  return hashMatches && validSignature
}
