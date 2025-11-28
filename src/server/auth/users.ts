// This file has been cleared for a clean rewrite.
import crypto from "crypto"
import { db } from "~/server/db"
import { users as usersTable } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import postgres from "postgres"
import { env } from "~/env"

type Permissions = Record<string, any>

interface UserRecord {
  username: string
  email: string
  passwordHash: string
  salt: string
  permissions: Permissions
  omnitokens: number
  omnicoins: number
  lastReset: string | Date
}

declare global {
  // eslint-disable-next-line no-var
  var authUsers: Map<string, UserRecord> | undefined
}

function genSalt() {
  return crypto.randomBytes(16).toString("hex")
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString("hex")
}

function tryParseJson(val: any) {
  try {
    if (typeof val === "string") {
      // Tenta parsear diretamente
      let parsed = JSON.parse(val)
      // Se o resultado ainda for uma string, tenta parsear novamente (caso de JSON duplamente escapado)
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed)
      }
      return parsed
    }
    return val
  } catch (e) {
    console.error("Error parsing JSON:", e, "Value:", val)
    return null
  }
}

if (typeof globalThis !== "undefined" && !globalThis.authUsers) {
  globalThis.authUsers = new Map<string, UserRecord>()

  // Bootstrap: create initial admin if env provided, else create a default non-sudo user
  const initUser = process.env.INIT_ADMIN_USER
  const initPass = process.env.INIT_ADMIN_PASS
  const initSudo = process.env.INIT_ADMIN_SUDO === "true"

  if (initUser && initPass) {
    const salt = genSalt()
    const hash = hashPassword(initPass, salt)
    globalThis.authUsers.set(initUser, {
      username: initUser,
      email: process.env.INIT_ADMIN_EMAIL || `${initUser}@example.com`,
      passwordHash: hash,
      salt,
      permissions: { sudo: !!initSudo },
      omnitokens: 10,
      omnicoins: 45,
      lastReset: new Date(),
    })
  } else {
    // default demo user (non-sudo)
    const demoUser = "user"
    const demoPass = "password"
    const salt = genSalt()
    const hash = hashPassword(demoPass, salt)
    globalThis.authUsers.set(demoUser, {
      username: demoUser,
      email: "user@example.com",
      passwordHash: hash,
      salt,
      permissions: { sudo: false },
      omnitokens: 10,
      omnicoins: 45,
      lastReset: new Date(),
    })
  }
}

export async function createUser(username: string, email: string, password: string, permissions: Permissions = { sudo: false }) {
  const salt = genSalt()
  const passwordHash = hashPassword(password, salt)
  const user: UserRecord = {
    username,
    email,
    passwordHash,
    salt,
    permissions,
    omnitokens: 10,
    omnicoins: 45,
    lastReset: new Date(),
  }
  // persist to DB
  try {
    await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      salt,
      permissions: JSON.stringify(permissions),
      omnitokens: 10,
      omnicoins: 45,
      lastReset: new Date(),
    })
  } catch (e) {
    console.error("Failed to insert user into DB", e)
  }

  // keep in-memory copy for compatibility
  globalThis.authUsers?.set(username, user)
  return user
}

export async function verifyUser(username: string, password: string) {
  // Try DB first with raw SQL to avoid email column issues
  try {
    const conn = postgres(env.DATABASE_URL)
    const result = await conn`
      SELECT username, "passwordHash", salt
      FROM "slider-omni_user"
      WHERE username = ${username}
      LIMIT 1
    `
    
    if (result && result.length > 0) {
      const row = result[0] as { salt: string; passwordHash: string }
      if (row) {
        const h = hashPassword(password, row.salt)
        return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(row.passwordHash, "hex"))
      }
    }
    await conn.end()
  } catch (e) {
    console.error("Error in verifyUser DB query:", e)
    // fall back to memory
  }

  const user = globalThis.authUsers?.get(username)
  if (!user) return false
  const h = hashPassword(password, user.salt)
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(user.passwordHash, "hex"))
}

export async function getUserSafe(username: string, forceFromDB = false) {
  console.log("getUserSafe called for username:", username, "forceFromDB:", forceFromDB)
  
  // Try DB first - use raw SQL to avoid schema issues
  // If forceFromDB is true, don't fall back to memory
  try {
    const conn = postgres(env.DATABASE_URL)
    
    // Try to query with email column, fallback to without if it doesn't exist
    let result: Array<Record<string, unknown>> = []
    try {
      result = await conn`
        SELECT username, email, "passwordHash", salt, permissions, omnitokens, omnicoins, "lastReset"
        FROM "slider-omni_user"
        WHERE username = ${username}
        LIMIT 1
      `
    } catch (emailError: unknown) {
      const err = emailError as { code?: string; message?: string }
      // If email column doesn't exist, query without it
      if (err?.code === '42703' && err?.message?.includes('email')) {
        console.log("Email column doesn't exist, querying without it")
        result = await conn`
          SELECT username, "passwordHash", salt, permissions, omnitokens, omnicoins, "lastReset"
          FROM "slider-omni_user"
          WHERE username = ${username}
          LIMIT 1
        `
      } else {
        throw emailError
      }
    }
    
    await conn.end()
    
    if (result && result.length > 0) {
      const row = result[0] as Record<string, unknown>
      console.log("User found in DB:", row.username)
      const rawPermissions = row.permissions
      console.log("Raw permissions from DB:", rawPermissions, "Type:", typeof rawPermissions)
      const parsedPermissions = tryParseJson(rawPermissions) ?? {}
      console.log("Parsed permissions from DB:", parsedPermissions, "Sudo:", parsedPermissions.sudo, "Type:", typeof parsedPermissions.sudo)
      
      return {
        username: row.username as string,
        email: (row.email as string) || (row.username as string),
        permissions: parsedPermissions,
        omnitokens: row.omnitokens as number,
        omnicoins: row.omnicoins as number,
        lastReset: row.lastReset as Date | string,
      }
    } else {
      console.log("User not found in DB")
      if (forceFromDB) {
        console.log("forceFromDB is true, not falling back to memory")
        return null
      }
      console.log("Trying memory fallback")
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.error("Error querying DB in getUserSafe:", err?.message || e)
    if (forceFromDB) {
      console.log("forceFromDB is true, not falling back to memory after error")
      return null
    }
    // Continue to fall back only if not forcing DB
  }

  // Fall back to memory
  const u = globalThis.authUsers?.get(username)
  if (u) {
    console.log("User found in memory, permissions:", u.permissions)
    return { username: u.username, email: u.email, permissions: u.permissions, omnitokens: u.omnitokens, omnicoins: u.omnicoins, lastReset: u.lastReset }
  }
  
  console.log("User not found in memory either")
  return null
}

export async function listUsers() {
  try {
    const rows = await db.query.users.findMany()
    if (rows) return rows.map((r) => ({ username: r.username, permissions: tryParseJson(r.permissions) ?? {}, omnitokens: r.omnitokens, omnicoins: r.omnicoins }))
  } catch (e) {
    // fall back
  }

  const out: Array<{ username: string; permissions: Permissions; omnitokens: number; omnicoins: number }> = []
  if (globalThis.authUsers) {
    for (const [k, v] of globalThis.authUsers.entries()) {
      out.push({ username: k, permissions: v.permissions, omnitokens: v.omnitokens, omnicoins: v.omnicoins })
    }
  }
  return out
}

export async function updatePermissions(username: string, permissions: Permissions) {
  try {
    await db.update(usersTable).set({ permissions: JSON.stringify(permissions) }).where(eq(usersTable.username, username))
  } catch (e) {
    // fall back
  }

  const u = globalThis.authUsers?.get(username)
  if (!u) return false
  u.permissions = { ...u.permissions, ...permissions }
  globalThis.authUsers?.set(username, u)
  return true
}

function needsReset(lastReset: string | Date) {
  try {
    const d = typeof lastReset === "string" ? new Date(lastReset) : lastReset
    const now = new Date()
    return d.getUTCFullYear() !== now.getUTCFullYear() || d.getUTCMonth() !== now.getUTCMonth()
  } catch (e) {
    return true
  }
}

export async function ensureMonthlyReset(username: string) {
  try {
    const row = await db.query.users.findFirst({ where: eq(usersTable.username, username) })
    if (row) {
      if (needsReset(row.lastReset)) {
        await db.update(usersTable).set({ omnitokens: 10, omnicoins: 45, lastReset: new Date() }).where(eq(usersTable.username, username))
        return
      }
    }
  } catch (e) {
    // fall back
  }

  const u = globalThis.authUsers?.get(username)
  if (!u) return
  if (needsReset(u.lastReset)) {
    u.omnitokens = 10
    u.omnicoins = 45
    u.lastReset = new Date()
    globalThis.authUsers?.set(username, u)
  }
}

export async function consumeOmnitokens(username: string, amount = 1) {
  try {
    await ensureMonthlyReset(username)
    const row = await db.query.users.findFirst({ where: eq(usersTable.username, username) })
    if (row && row.omnitokens >= amount) {
      await db.update(usersTable).set({ omnitokens: row.omnitokens - amount }).where(eq(usersTable.username, username))
      return true
    }
  } catch (e) {
    // fall back
  }

  const u = globalThis.authUsers?.get(username)
  if (!u) return false
  await ensureMonthlyReset(username)
  if (u.omnitokens < amount) return false
  u.omnitokens -= amount
  globalThis.authUsers?.set(username, u)
  return true
}

export async function consumeOmnicoins(username: string, amount = 1) {
  try {
    await ensureMonthlyReset(username)
    const row = await db.query.users.findFirst({ where: eq(usersTable.username, username) })
    if (row && row.omnicoins >= amount) {
      await db.update(usersTable).set({ omnicoins: row.omnicoins - amount }).where(eq(usersTable.username, username))
      return true
    }
  } catch (e) {
    // fall back
  }

  const u = globalThis.authUsers?.get(username)
  if (!u) return false
  await ensureMonthlyReset(username)
  if (u.omnicoins < amount) return false
  u.omnicoins -= amount
  globalThis.authUsers?.set(username, u)
  return true
}

export async function resetCredits(username: string) {
  try {
    await db.update(usersTable).set({
      omnitokens: 10,
      omnicoins: 45,
      lastReset: new Date(),
    }).where(eq(usersTable.username, username))
    return true
  } catch (e) {
    // fallback to memory
  }
  const u = globalThis.authUsers?.get(username)
  if (!u) return false
  u.omnitokens = 10
  u.omnicoins = 45
  u.lastReset = new Date()
  globalThis.authUsers?.set(username, u)
  return true
}
