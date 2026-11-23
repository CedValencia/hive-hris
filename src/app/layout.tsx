import "./globals.css";
import type { Metadata } from "next";
<<<<<<< HEAD
export const metadata: Metadata = { title: "Hive HRIS", description: "Attendance, leave and payslips in one place" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
=======
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hive HRIS",
  description: "Attendance, leave and payslips in one place",
};

// Applies the saved theme before the first paint so the page doesn't flash the wrong colours.
const themeInit = `try{var t=localStorage.getItem("hive.theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
>>>>>>> e8f8b1b (signin complete)
