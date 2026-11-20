import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "mubest_admin";
const SESSION_DAYS = 14;

export function parseCookies(req) {
  const raw = req.headers?.cookie || "";
  return Object.fromEntries(raw.split(";").map(part => {
    const i = part.indexOf("=");
    if (i < 0) return ["", ""];
    return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }).filter(([key]) => key));
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(key).toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hex] = stored.split(":");
  const expected = Buffer.from(hex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function setSessionCookie(res, token, req) {
  const secure = process.env.VERCEL === "1" || req.headers?.["x-forwarded-proto"] === "https";
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`);
}

export function clearSessionCookie(res, req) {
  const secure = process.env.VERCEL === "1" || req.headers?.["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
}

export async function createSession(userId, req, res) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await query(
    "INSERT INTO admin_sessions (user_id,token_hash,expires_at) VALUES ($1,$2,NOW() + INTERVAL '14 days')",
    [userId, tokenHash]
  );
  setSessionCookie(res, token, req);
}

export async function getSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const rows = await query(
    `SELECT u.id AS user_id,u.email
     FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>NOW()
     LIMIT 1`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

export async function requireAdmin(req) {
  return getSession(req);
}

export async function deleteSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (token) await query("DELETE FROM admin_sessions WHERE token_hash=$1", [hashToken(token)]);
}

export function assertSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return;
  const expected = process.env.SITE_URL;
  if (!expected) return;
  const normalize = value => String(value).replace(/\/+$/, "").toLowerCase();
  if (normalize(origin) !== normalize(expected)) {
    const error = new Error("Request origin is not allowed.");
    error.statusCode = 403;
    throw error;
  }
}
