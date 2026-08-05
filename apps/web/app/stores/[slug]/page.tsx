import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObservationTable } from "@/components/store/observation-table";
import { ApiError, getStoreDetail } from "@/lib/api-client";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const store = await getStoreDetail(slug);
    const firstLocation = store.locations[0];
    const description = firstLocation
      ? `MCC được duyệt cho ${store.merchantName} tại ${firstLocation.address}.`
      : `Thông tin MCC được duyệt cho ${store.merchantName}.`;

    return {
      title: `${store.merchantName} | MCC Map Vietnam`,
      description,
      alternates: { canonical: `/stores/${store.storeSlug}` },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { title: "Không tìm thấy cửa hàng | MCC Map Vietnam" };
    }
    throw error;
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const store = await getStoreOrNotFound(slug);

  return (
    <main className="content-shell">
      <header className="mcc-header">
        <Link className="brand" href="/">
          MCC Map
          <span>Vietnam</span>
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link href="/reports">Báo cáo</Link>
          <Link href="/admin">Quản trị</Link>
        </nav>
      </header>
      <article className="store-page">
        <p className="eyebrow">Tra cứu cửa hàng</p>
        <h1>{store.merchantName}</h1>
        <p className="store-intro">Các quan sát dưới đây đã được quản trị viên duyệt.</p>
        <ObservationTable locations={store.locations} />
      </article>
    </main>
  );
}

async function getStoreOrNotFound(slug: string) {
  try {
    return await getStoreDetail(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
