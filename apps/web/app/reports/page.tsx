import Link from "next/link";
import { ReportForm } from "@/components/reports/report-form";

export default function ReportsPage() {
  return (
    <main className="content-shell">
      <header className="mcc-header">
        <Link className="brand" href="/">
          MCC Map
          <span>Vietnam</span>
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link href="/">Tra cứu</Link>
          <Link href="/admin">Quản trị</Link>
        </nav>
      </header>
      <ReportForm />
    </main>
  );
}
