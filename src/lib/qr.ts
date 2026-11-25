import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
// SERVER ONLY. QR_SECRET lives in .env.local and never reaches the browser.
const secret = () => {
  const s = process.env.QR_SECRET;
  if (!s || s.length < 32) throw new Error("QR_SECRET must be set (32+ chars)");
  return s;
};
export const QR_TTL = 30, QR_MAX_AGE = 90;
const sign = (id: string, ts: number) => createHmac("sha256", secret()).update(`${id}|${ts}`).digest("base64url");
export const makeToken = (employeeId: string) => {
  const ts = Math.floor(Date.now() / 1000);
  return ["HIVE", employeeId, ts, sign(employeeId, ts)].join("|");
};

// Badge QR: no expiry, signed on the server, tied to a version number.
// Bumping profiles.qr_version ("Generate new QR") makes every older badge QR out of date.
const badgeSig = (id: string, v: number) => sign(`badge:${id}:${v}`, 0);
export const makeBadgeToken = (employeeId: string, version = 0) =>
  ["HIVE", employeeId, "B" + version, badgeSig(employeeId, version)].join("|");

export function readToken(text: string): { id: string; v?: number } | { err: string } {
  const p = String(text).split("|");
  if (p[0] !== "HIVE" || p.length !== 4) return { err: "Not a Hive QR code" };
  if (p[2].startsWith("B")) {
    const v = Number(p[2].slice(1));
    if (!Number.isInteger(v) || v < 0) return { err: "Invalid QR code" };
    const w = Buffer.from(badgeSig(p[1], v)), g = Buffer.from(p[3]);
    if (w.length !== g.length || !timingSafeEqual(w, g)) return { err: "Invalid QR code" };
    return { id: p[1], v };
  }
  const want = Buffer.from(sign(p[1], +p[2])), got = Buffer.from(p[3]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { err: "Invalid QR code" };
  if (Math.abs(Date.now() / 1000 - +p[2]) > QR_MAX_AGE) return { err: "QR expired — ask the employee to refresh their screen" };
  return { id: p[1] };
}