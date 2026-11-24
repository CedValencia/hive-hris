import { getPortal } from "@/lib/employee-data";

/** Outer guard for everything under /employee: must be signed in, and must be an employee (admins are sent to /admin). */
export default async function EmployeeRoot({ children }: { children: React.ReactNode }) {
  await getPortal();
  return <>{children}</>;
}
