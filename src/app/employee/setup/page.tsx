import { getPortal } from "@/lib/employee-data";
import { shortDate } from "@/lib/employee-calc";
import { Icon } from "@/components/Icon";
import { SetupForm } from "@/components/employee-forms";
import { DocumentsPanel, type DocRow } from "@/components/DocumentsPanel";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const p = await getPortal();
  const { me: e, shift, today } = p;
  const { data: rows } = await p.sb
    .from("employee_documents")
    .select("id, doc_type, file_name, size_bytes, created_at, uploaded_by")
    .eq("employee_id", p.user.id)
    .order("created_at", { ascending: false });
  const docs: DocRow[] = (rows ?? []).map((r) => ({
    id: r.id,
    doc_type: r.doc_type,
    file_name: r.file_name,
    size_bytes: r.size_bytes,
    date: new Date(r.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "numeric" }),
    by: r.uploaded_by === p.user.id ? "you" : "HR",
  }));
  const first = e.full_name.split(" ")[0];
  const Lock = ({ k, v }: { k: string; v: string }) => (<><div className="k">{k} <Icon name="lock" /></div><div className="v">{v}</div></>);
  return (
    <>
      <div className="eyebrow">Welcome to Hive</div>
      <h1>Hi {first},<br /><em>let’s finish your profile.</em></h1>
      <p className="lead">HR created your account. Check the details below, upload your resume, add your personal information and choose your own password. It takes about two minutes — you can’t open the rest of Hive until this is done.</p>
      <div className="steps"><span><b>1</b> Confirm</span><span><b>2</b> About you</span><span><b>3</b> Password</span></div>
      <div style={{ margin: "22px 0 10px" }}>
        <div className="fig">UPLOAD YOUR DOCUMENTS</div>
        <p className="mut" style={{ fontSize: 13.5, margin: "6px 0 0" }}>Your resume is required before you can finish. You can add IDs and other requirements here too.</p>
      </div>
      <DocumentsPanel employeeId={p.user.id} docs={docs} />
      <div style={{ height: 20 }} />
      <SetupForm today={today}>
        <div className="card">
          <div className="fig">STEP 1 · SET BY HR</div><h3 style={{ marginTop: 4 }}>Your account</h3>
          <div className="docgrid">
            <Lock k="Full name" v={e.full_name} /><Lock k="Work email" v={e.email ?? ""} />
            <Lock k="Username" v={e.username ?? e.employee_no ?? ""} /><Lock k="Employee ID" v={e.employee_no ?? ""} />
            <Lock k="Position" v={e.position ?? ""} /><Lock k="Department" v={e.department ?? ""} />
            <Lock k="Date hired" v={shortDate(e.hired_on)} /><Lock k="Shift" v={`${shift.name} · ${shift.start}–${shift.end}`} />
          </div>
          <label className="chk" style={{ marginTop: 16 }}><input type="checkbox" name="ok" /> These details are correct. (If something is wrong, tell HR — they manage these fields.)</label>
        </div>
      </SetupForm>
    </>
  );
}