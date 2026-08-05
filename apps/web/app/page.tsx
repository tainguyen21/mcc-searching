"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MerchantMap } from "@/components/map/merchant-map";
import { LocationPicker } from "@/components/map/location-picker";
import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import {
  type MerchantSearchResult,
  searchMerchants,
} from "@/lib/api-client";

export default function Home() {
  const [query, setQuery] = useState("");
  const [mccCode, setMccCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [province, setProvince] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number }>();
  const [items, setItems] = useState<MerchantSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const runSearch = useCallback(async (locationOverride?: { latitude: number; longitude: number }) => {
    const activeLocation = locationOverride ?? location;
    setStatus("loading");
    setMessage("");
    try {
      const response = await searchMerchants({
        query: query || undefined,
        mccCode: mccCode || undefined,
        categoryId: categoryId || undefined,
        latitude: activeLocation?.latitude?.toString(),
        longitude: activeLocation?.longitude?.toString(),
        radiusKm: activeLocation ? radiusKm : undefined,
      });
      const filtered = province
        ? response.items.filter((item) =>
            item.address.toLocaleLowerCase("vi").includes(province.toLocaleLowerCase("vi")),
          )
        : response.items;
      setItems(filtered);
      setSelectedId(filtered[0]?.locationId);
      if (filtered.length === 0) {
        setMessage("Chưa có địa điểm phù hợp. Bạn có thể gửi báo cáo để cộng đồng cùng cập nhật.");
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Không thể tải kết quả. Kiểm tra API rồi thử lại.");
    }
  }, [categoryId, location, mccCode, province, query, radiusKm]);

  return (
    <main className="mcc-shell">
      <header className="mcc-header">
        <Link className="brand" href="/">
          MCC Map
          <span>Vietnam</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/reports">Báo cáo</Link>
          <Link href="/admin">Quản trị</Link>
        </nav>
      </header>

      <section className="search-panel" aria-label="Merchant search">
      <SearchBar value={query} onChange={setQuery} onSubmit={() => void runSearch()} />
        <SearchFilters
          mccCode={mccCode}
          categoryId={categoryId}
          radiusKm={radiusKm}
          province={province}
          onMccCodeChange={setMccCode}
          onCategoryIdChange={setCategoryId}
          onRadiusKmChange={setRadiusKm}
          onProvinceChange={setProvince}
        />
        <LocationPicker
          address={manualAddress}
          onAddressChange={setManualAddress}
          onLocationChange={setLocation}
          onLocate={(nextLocation) => void runSearch(nextLocation)}
        />
      </section>

      <section className="workspace">
        <div className="map-region">
          <MerchantMap
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <aside className="results-sheet">
          <SearchResults
            items={items}
            selectedId={selectedId}
            status={status}
            message={message}
            onSelect={setSelectedId}
          />
        </aside>
      </section>
    </main>
  );
}
