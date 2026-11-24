import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortal, loadPayroll } from "@/lib/employee-data";
import { PHP, RATES, periods } from "@/lib/employee-calc";
import { PrintButton } from "@/components/employee-live";

export const dynamic = "force-dynamic";
const pct = (k: keyof typeof RATES) => +(RATES[k] * 100).toFixed(2) + "%";

/** The employee id comes from the session — the URL only picks a pay period, so nobody can open another person's slip. */
export default async function PayslipPage({ params }: { params: Promise<{ period: string }> | { period: string } }) {
  const { period } = await params;
  const p = await getPortal();
  const per = periods(p.today).find((q) => q.slug === period && q.st !== "Upcoming");
  if (!per) notFound();
  const x = (await loadPayroll(p))(per), e = p.me;
  const row = (k: keyof typeof RATES, label: string) => {
    const nd = x[k] <= 0;
    return (<><div className="k" style={nd ? { opacity: 0.55 } : undefined}>{label}{nd ? <> <span className="tag">Not deducted</span></> : null}</div>
      <div className="v" style={nd ? { opacity: 0.55 } : undefined}>−{PHP(x[k])}</div></>);
  };
  return (
    <div className="slipdoc print-area">
      <div className="sphd">
        <div><div className="fig">PAYSLIP</div><h3 style={{ marginTop: 6 }}>{e.full_name}</h3>
          <div className="mut" style={{ fontSize: 13 }}>{e.employee_no ?? ""} · {e.position ?? ""} · {e.department ?? ""}</div></div>
        <div style={{ textAlign: "right" }}><b>{per.label}</b><div className="mut" style={{ fontSize: 12.5 }}>Pay date: {per.to}</div></div>
      </div>
      <div className="fig" style={{ marginTop: 14 }}>EARNINGS</div>
      <div className="docgrid">
        <div className="k">Basic pay (semi-monthly)</div><div className="v">{PHP(x.half)}</div>
        <div className="k">Allowances (transport &amp; COLA)</div><div className="v">{PHP(x.allow)}</div>
        <div className="k">Overtime ({x.otHrs} hrs × 125%)</div><div className="v">{PHP(x.ot)}</div>
        {x.extras.map((z, i) => (<Fragment key={i}><div className="k">{z.label}</div><div className="v">{PHP(z.amt)}</div></Fragment>))}
        <div className="k" style={{ fontWeight: 700, color: "var(--tx)" }}>Gross pay</div><div className="v" style={{ fontWeight: 700 }}>{PHP(x.g)}</div>
      </div>
      <div className="fig" style={{ marginTop: 16 }}>DEDUCTIONS</div>
      <div className="docgrid">
        {row("sss", `SSS contribution (${pct("sss")})`)}
        {row("ph", `PhilHealth contribution (${pct("ph")})`)}
        {row("pg", `Pag-IBIG contribution (${pct("pg")})`)}
        <div className="k">Taxable income (gross − allowances − contributions)</div><div className="v mut">{PHP(x.taxable)}</div>
        <div className="k">Withholding tax</div><div className="v">−{PHP(x.tx)}</div>
        <div className="k" style={{ fontWeight: 700, color: "var(--tx)" }}>Total deductions</div><div className="v" style={{ fontWeight: 700 }}>−{PHP(x.ded)}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 18, paddingTop: 14, borderTop: "2px solid var(--ac)" }}>
        <div><div className="fig">NET PAY</div><div className="net">{PHP(x.net)}</div></div>
        <div className="mut" style={{ fontSize: 12, maxWidth: "38ch" }}>Withholding tax follows the BIR TRAIN semi-monthly table. Allowances are treated as non-taxable de minimis benefits. Verify contribution rates against current SSS, PhilHealth and Pag-IBIG tables before production use.</div>
      </div>
      <div className="mact no-print"><Link className="sm" href="/employee/payslips">Back</Link><PrintButton /></div>
    </div>
  );
}