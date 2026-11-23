import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Hive HRIS", description: "Attendance, leave and payslips in one place" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
