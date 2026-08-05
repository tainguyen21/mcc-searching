"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import type { MerchantSearchResult } from "@/lib/api-client";

type Props = {
  items: MerchantSearchResult[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function MerchantMap({ items, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!container.current || !token || map.current) {
      return;
    }
    mapboxgl.accessToken = token;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [108.2772, 14.0583],
      zoom: 4.4,
    });
    return () => map.current?.remove();
  }, [token]);

  useEffect(() => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (!map.current) {
      return;
    }
    for (const item of items) {
      const marker = new mapboxgl.Marker({ color: item.locationId === selectedId ? "#d9482b" : "#127a77" })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(item.merchantName))
        .addTo(map.current);
      marker.getElement().addEventListener("click", () => onSelect(item.locationId));
      markers.current.push(marker);
    }
    const selected = items.find((item) => item.locationId === selectedId);
    if (selected) {
      map.current.flyTo({ center: [selected.longitude, selected.latitude], zoom: 14, essential: true });
    }
  }, [items, onSelect, selectedId]);

  if (!token) {
    return (
      <div className="map-fallback">
        <strong>Bản đồ đang chờ Mapbox token</strong>
        <span>Thêm `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` để hiển thị bản đồ tương tác.</span>
      </div>
    );
  }
  return <div className="merchant-map" ref={container} aria-label="Bản đồ địa điểm MCC" />;
}
