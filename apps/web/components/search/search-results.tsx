"use client";

import type { MerchantSearchResult } from "@/lib/api-client";

type Props = {
  items: MerchantSearchResult[];
  selectedId?: string;
  status: "idle" | "loading" | "error";
  message: string;
  onSelect: (id: string) => void;
};

export function SearchResults({ items, selectedId, status, message, onSelect }: Props) {
  if (status === "loading") {
    return <p className="result-state">Đang tìm địa điểm...</p>;
  }
  if (status === "error") {
    return <p className="result-state error">{message}</p>;
  }
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>{message || "Nhập tìm kiếm để xem các địa điểm đã được duyệt."}</p>
        <a href="/report">Gửi báo cáo MCC</a>
      </div>
    );
  }

  return (
    <div className="result-list">
      {items.map((item) => (
        <button
          className={`result-item ${item.locationId === selectedId ? "selected" : ""}`}
          key={item.locationId}
          onClick={() => onSelect(item.locationId)}
          type="button"
        >
          <span className="result-name">{item.merchantName}</span>
          <span className="result-address">{item.address}</span>
          <span className="result-meta">
            {item.observations.map((observation) => observation.mccCode).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );
}
