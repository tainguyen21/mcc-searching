import Link from "next/link";
import { requireAdmin } from "@/lib/server-session";

export default async function AdminPage() {
  const user = await requireAdmin("/admin");

  return (
    <main className="content-shell">
      <header className="mcc-header">
        <Link className="brand" href="/">
          MCC Map
          <span>Vietnam</span>
        </Link>
        <nav aria-label="Điều hướng quản trị">
          <Link href="/">Tra cứu</Link>
          <Link href="/reports">Báo cáo</Link>
        </nav>
      </header>
      <section className="content-panel admin-home">
        <p className="eyebrow">Quản trị viên</p>
        <h1>Không gian quản trị</h1>
        <p>{user.displayName ?? "Tài khoản quản trị"} đang có phiên làm việc hợp lệ.</p>
        <div className="admin-links">
          <Link href="/admin/staging">
            <strong>Duyệt báo cáo</strong>
            <span>Xem, duyệt hoặc từ chối các quan sát MCC đang chờ.</span>
          </Link>
          <Link href="/admin/sources">
            <strong>Nguồn dữ liệu</strong>
            <span>Kiểm tra trạng thái nguồn và khởi chạy job nhập dữ liệu.</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
