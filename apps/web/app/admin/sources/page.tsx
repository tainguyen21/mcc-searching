import Link from "next/link";
import { SourceJobs } from "@/components/admin/source-jobs";
import { requireAdmin } from "@/lib/server-session";

export default async function AdminSourcesPage() {
  await requireAdmin("/admin/sources");

  return (
    <main className="content-shell">
      <header className="mcc-header">
        <Link className="brand" href="/admin">
          MCC Map
          <span>Admin</span>
        </Link>
        <nav aria-label="Điều hướng quản trị">
          <Link href="/admin">Tổng quan</Link>
          <Link href="/admin/staging">Duyệt báo cáo</Link>
        </nav>
      </header>
      <section className="content-panel">
        <div className="panel-heading">
          <p className="eyebrow">Ingestion</p>
          <h1>Nguồn dữ liệu</h1>
          <p>Facebook Groups chỉ được bật khi quyền API chính thức đã được xác minh.</p>
        </div>
        <SourceJobs />
      </section>
    </main>
  );
}
