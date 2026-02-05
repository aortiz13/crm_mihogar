import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret-key-32-chars-at-least!!'
// NOTE: In production, strictly use a dedicated ENCRYPTION_KEY of 32 bytes via env var. 
// For this playground, we fallback to something available, but warn.

// Ensure key is 32 bytes
const getKey = () => {
    return crypto.scryptSync(SECRET_KEY, 'salt', 32)
}

export function encrypt(text: string) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(text: string) {
    const [ivHex, authTagHex, encryptedHex] = text.split(':')
    if (!ivHex || !authTagHex || !encryptedHex) return null

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}
