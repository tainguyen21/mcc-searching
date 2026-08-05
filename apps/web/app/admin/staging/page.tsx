import Link from "next/link";
import { StagingQueue } from "@/components/admin/staging-queue";
import { requireAdmin } from "@/lib/server-session";

export default async function AdminStagingPage() {
  await requireAdmin("/admin/staging");

  return (
    <main className="content-shell">
      <header className="mcc-header">
        <Link className="brand" href="/admin">
          MCC Map
          <span>Admin</span>
        </Link>
        <nav aria-label="Điều hướng quản trị">
          <Link href="/admin">Tổng quan</Link>
          <Link href="/admin/sources">Nguồn dữ liệu</Link>
        </nav>
      </header>
      <section className="content-panel">
        <div className="panel-heading">
          <p className="eyebrow">Hàng chờ</p>
          <h1>Duyệt quan sát MCC</h1>
          <p>Chỉ quan sát được duyệt mới được hiển thị trên trang tra cứu.</p>
        </div>
        <StagingQueue />
      </section>
    </main>
  );
}
