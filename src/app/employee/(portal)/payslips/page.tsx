import Link from "next/link";
import { getPortal, loadPayroll } from "@/lib/employee-data";
import { PHP, periods, shortDate } from "@/lib/employee-calc";
import { PageHead, Stat, Table, Tag, Dash } from "@/components/employee-ui";

export const dynamic = "force-dynamic";

export default async function EmployeePayslips() {
  const p = await getPortal();
  const list = periods(p.today), payFor = await loadPayroll(p);
  const x = list[0] ? payFor(list[0]) : null;
  return (
    <>
      <PageHead eyebrow="Employee / Payslips" title={<>Your pay,<br /><em>clearly broken down.</em></>}
        lead="Select a pay period to see the full breakdown — earnings, contributions, tax and net pay." />
      <div className="grid g4">
        <Stat f="NEXT PAYDAY" t={list[0] ? shortDate(list[0].to) : "—"} v={<span style={{ fontSize: 26 }}>{x ? PHP(x.net) : "—"}</span>} sub="estimated net · semi-monthly" />
        <Stat f="THIS PERIOD" t="Gross pay" v={<span style={{ fontSize: 26 }}>{x ? PHP(x.g) : "—"}</span>} sub="basic + allowances + overtime" />
        <Stat f="THIS PERIOD" t="Deductions" v={<span style={{ fontSize: 26 }}>{x ? PHP(x.ded) : "—"}</span>} sub="SSS · PhilHealth · Pag-IBIG · tax" />
        <Stat f="YTD" t="Payslips" v={list.filter((q) => q.st !== "Upcoming").length} sub="available to view" />
      </div>
      <div className="mt">
        <Table head={["Pay period", "Gross pay", "Net pay", "Status", ""]} empty="No payslips yet."
          rows={list.map((q) => {
            const y = payFor(q);
            return [
              q.label, PHP(y.g), <b key="n">{PHP(y.net)}</b>, <Tag key="s" s={q.st} />,
              q.st !== "Upcoming" ? <Link key="v" className="sm" href={`/employee/payslips/${q.slug}`}>View / PDF</Link> : <Dash key="d" />,
            ];
          })} />
      </div>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 14 }}>You can only access your own payslips. Open one and choose <b>Print / Save as PDF</b> — pick “Save as PDF” in the print dialog.</p>
    </>
  );
}