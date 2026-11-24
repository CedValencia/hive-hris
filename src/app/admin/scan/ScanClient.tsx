"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { simulateToken } from "./actions";

type Emp = { id: string; name: string; no: string | null };
type Log = { ok: boolean; late?: boolean; msg: string; t: string };
type ScannerLike = { stop: () => Promise<void>; clear: () => void };

const hm = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

export function ScanClient({ employees }: { employees: Emp[] }) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<Log[]>([]);
  const [banner, setBanner] = useState<Log | null>(null);
  const [camErr, setCamErr] = useState("");
  const [sim, setSim] = useState(employees[0]?.id ?? "");
  const [pending, start] = useTransition();
  const scanner = useRef<ScannerLike | null>(null);
  const lastText = useRef<Record<string, string>>({});   // one code in view only counts once
  const lastHit = useRef<Record<string, number>>({});    // min. 60 s between a clock-in and a clock-out
  const busy = useRef(false);

  async function handle(text: string, force: boolean) {
    if (busy.current) return;
    const id = text.split("|")[1] ?? text;               // only used for client-side de-duplication; the server verifies the signature
    let res: Log;
    if (!force && lastText.current[id] === text) return;
    lastText.current[id] = text;
    const wait = 60 - Math.floor((Date.now() - (lastHit.current[id] ?? 0)) / 1000);
    if (!force && wait > 0) {
      res = { ok: false, msg: `Already scanned a moment ago — wait ${wait}s before the next scan`, t: hm() };
    } else {
      busy.current = true;
      try {
        const r = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        const j = (await r.json().catch(() => null)) as { ok: boolean; msg: string; late?: boolean } | null;
        res = { ok: !!j?.ok, late: j?.late, msg: j?.msg ?? "Scan failed", t: hm() };
        if (j?.ok) lastHit.current[id] = Date.now();
      } catch { res = { ok: false, msg: "Could not reach the server", t: hm() }; }
      finally { busy.current = false; }
    }
    setBanner(res);
    setLog((l) => [res, ...l].slice(0, 20));
  }
  const handleRef = useRef(handle); handleRef.current = handle;

  async function startCam() {
    if (scanner.current) return;
    setCamErr("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const sc = new Html5Qrcode("reader");
      scanner.current = sc;
      setRunning(true);
      await sc.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 230, height: 230 } }, (txt: string) => handleRef.current(txt, false), () => {});
    } catch {
      scanner.current = null; setRunning(false);
      setCamErr("Couldn't open the camera — allow access (HTTPS or localhost needed). Use “Simulate a scan” to test.");
    }
  }
  async function stopCam() {
    const sc = scanner.current; scanner.current = null; setRunning(false);
    if (sc) { try { await sc.stop(); sc.clear(); } catch {} }
  }
  useEffect(() => () => { void stopCam(); }, []);  // release the camera when leaving the page

  return (
    <>
      {banner && (
        <div className={"hintbox"} role="status" aria-live="polite"
          style={{ marginBottom: 14, color: banner.ok ? (banner.late ? "var(--warn)" : "var(--ok)") : "var(--bad)" }}>
          {banner.msg}
        </div>
      )}
      <div className="grid g2">
        <div className="card">
          <div className="cardhd"><div><div className="fig">CAMERA</div><h3>Scan employee QR</h3></div></div>
          <div id="reader" />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="pri" onClick={startCam} disabled={running}><Icon name="qr" /> Start camera</button>
            <button onClick={stopCam} disabled={!running}>Stop</button>
          </div>
          {camErr && <p style={{ fontSize: 12.5, margin: "10px 0 0", color: "var(--bad)" }}>{camErr}</p>}
          <p className="mut" style={{ fontSize: 12.5, margin: "10px 0 0" }}>Needs camera permission, and the page must be served over HTTPS or localhost.</p>
        </div>
        <div className="card">
          <div className="cardhd"><div><div className="fig">NO CAMERA?</div><h3>Simulate a scan</h3></div></div>
          <p className="mut" style={{ fontSize: 13, margin: "0 0 10px" }}>For testing on one device: pick an employee and it scans a fresh code for them.</p>
          <label htmlFor="simE">Employee</label>
          <select id="simE" value={sim} onChange={(e) => setSim(e.target.value)}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.no ? ` · ${e.no}` : ""}</option>)}
          </select>
          <div className="row" style={{ marginTop: 12 }}>
            <button disabled={pending || !sim} onClick={() => start(async () => {
              const r = await simulateToken(sim);
              if (r.ok && r.text) await handle(r.text, true);
              else setBanner({ ok: false, msg: r.msg ?? "Could not create a test code", t: hm() });
            })}>{pending ? "Scanning…" : "Simulate scan"}</button>
          </div>
        </div>
      </div>
      <div className="card mt">
        <div className="fig">RECENT SCANS</div>
        <div>
          {log.length === 0 && <p className="mut">Nothing scanned yet.</p>}
          {log.map((l, i) => (
            <div className="ls" key={i}><span className={"tag " + (l.ok ? "ok" : "wait")}>{l.ok ? "OK" : "Check"}</span> {l.msg} <span className="mut">· {l.t}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}
