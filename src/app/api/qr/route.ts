import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { supabaseServer } from "@/lib/supabase/server";
import { makeToken, QR_TTL } from "@/lib/qr";

export const dynamic = "force-dynamic";
/** The employee's screen polls this every ~25 s. The code is signed on the server, so it can't be forged in the browser. */
export async function GET() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const svg = await QRCode.toString(makeToken(user.id), { type: "svg", margin: 1 });
  return NextResponse.json({ svg, ttl: QR_TTL });
}
