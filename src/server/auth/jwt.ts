import crypto from "crypto"

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me"

function base64UrlEncode(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function base64UrlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/")
  while (input.length % 4) input += "="
  return Buffer.from(input, "base64")
}

export function signJwt(payload: Record<string, any>, expiresInSeconds = 60 * 60) {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + expiresInSeconds }

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)))
  const bodyB64 = base64UrlEncode(Buffer.from(JSON.stringify(body)))
  const data = `${headerB64}.${bodyB64}`

  const sig = crypto.createHmac("sha256", SECRET).update(data).digest()
  const sigB64 = base64UrlEncode(sig)

  return `${data}.${sigB64}`
}

export function verifyJwt(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) throw new Error("Invalid token format")
    const [headerB64, bodyB64, sigB64] = parts
    
    if (!headerB64 || !bodyB64 || !sigB64) {
      throw new Error("Invalid token format")
    }
    
    const data = `${headerB64}.${bodyB64}`

    const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest()
    const expectedSigB64 = base64UrlEncode(expectedSig)

    if (!crypto.timingSafeEqual(Buffer.from(expectedSigB64), Buffer.from(sigB64))) {
      throw new Error("Invalid signature")
    }

    const payloadBuf = base64UrlDecode(bodyB64)
    const payload = JSON.parse(payloadBuf.toString("utf8")) as any

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && now > payload.exp) throw new Error("Token expired")

    return payload
  } catch (err) {
    throw err
  }
}
