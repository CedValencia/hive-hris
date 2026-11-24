import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { computePay, periodList, PHP, type Adj } from "@/lib/payroll-calc";
import { fmtDate } from "@/lib/fmt";
import { PayslipTable, type SlipRow } from "./PayslipTable";

export const dynamic = "force-dynamic";

function Stat({ fig, title, value, sub }: { fig: string; title: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card stat">
      <div className="fig">{fig}</div>
      <h3>{title}</h3>
      <div className="big">{value}</div>
      {sub && <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default async function PayslipsPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const periods = periodList(today, 8);
  const oldest = periods[periods.length - 1].from;

  // RLS: an employee only ever gets their own rows, and adjustments only for processed periods.
  const [meQ, runs, adjs, ot] = await Promise.all([
    sb.from("profiles").select("full_name, employee_code, position, department, salary_semi, worker_type").eq("id", user.id).single(),
    sb.from("payroll_runs").select("period_from, status"),
    sb.from("pay_adjustments").select("period_from, sss, ph, pg, extras").eq("employee_id", user.id),
    sb.from("hr_requests").select("request_date, overtime_hours").eq("employee_id", user.id).eq("status", "Approved").ilike("type", "%overtime%").gte("request_date", oldest),
  ]);
  const me = meQ.data;
  if (!me) redirect("/signin");

  const emp = { salary_semi: Number(me.salary_semi) || 0, worker_type: me.worker_type as string };
  const runBy = new Map((runs.data ?? []).map((r) => [r.period_from as string, r.status as string]));
  const adjBy = new Map((adjs.data ?? []).map((a) => [a.period_from as string, a]));

  const rows: SlipRow[] = periods.map((p) => {
    const released = runBy.get(p.from) === "Processed";
    const a = adjBy.get(p.from);
    const adj: Adj = a && released ? ({ sss: a.sss ?? undefined, ph: a.ph ?? undefined, pg: a.pg ?? undefined, extras: a.extras ?? [] } as Adj) : null;
    const otHours = (ot.data ?? [])
      .filter((o) => o.request_date >= p.from && o.request_date <= p.to)
      .reduce((s, o) => s + (Number(o.overtime_hours) || 0), 0);
    const x = computePay(emp, adj, otHours);
    const status = released ? (p.to < today ? "Paid" : "Processed") : p.to >= today ? "Upcoming" : "Pending release";
    return { ...p, status, released, gross: x.g, net: x.net, adj, otHours };
  });

  // estimate for the current period (HR may still adjust it before releasing)
  const est = computePay(emp, null, rows[0].otHours);
  const available = rows.filter((r) => r.released).length;

  return (
    <>
      <div className="eyebrow">Employee / Payslips</div>
      <h1>
        Your pay,
        <br />
        <em>clearly broken down.</em>
      </h1>
      <p className="lead">Select a pay period to see the full breakdown: earnings, contributions, tax and net pay.</p>

      <div className="grid g4">
        <Stat fig="NEXT PAYDAY" title={fmtDate(rows[0].to)} value={<span style={{ fontSize: 26 }}>{PHP(est.net)}</span>} sub="estimated net · semi-monthly" />
        <Stat fig="THIS PERIOD" title="Gross pay" value={<span style={{ fontSize: 26 }}>{PHP(est.g)}</span>} sub="basic + allowances + overtime" />
        <Stat fig="THIS PERIOD" title="Deductions" value={<span style={{ fontSize: 26 }}>{PHP(est.ded)}</span>} sub="SSS · PhilHealth · Pag-IBIG · tax" />
        <Stat fig="RELEASED" title="Payslips" value={available} sub="available to view" />
      </div>

      <div className="mt">
        <PayslipTable
          rows={rows}
          me={{
            name: me.full_name,
            code: me.employee_code,
            position: me.position,
            department: me.department,
            salary: emp.salary_semi,
            workerType: emp.worker_type,
          }}
        />
      </div>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 14 }}>
        You can only access your own payslips, and only after HR releases them. Choose <b>PDF</b> to print or save a copy: pick &ldquo;Save as PDF&rdquo; in the print dialog.
      </p>
    </>
  );
}