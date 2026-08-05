"use client";

import { useState } from "react";
import { requestCurrentLocation } from "@/lib/geolocation";

type Props = {
  address: string;
  onAddressChange: (value: string) => void;
  onLocationChange: (value: { latitude: number; longitude: number }) => void;
  onLocate: (location: { latitude: number; longitude: number }) => void;
};

export function LocationPicker({ address, onAddressChange, onLocationChange, onLocate }: Props) {
  const [notice, setNotice] = useState("");

  async function locate() {
    try {
      const location = await requestCurrentLocation();
      onLocationChange(location);
      setNotice("Đang tìm quanh vị trí của bạn.");
      onLocate(location);
    } catch {
      setNotice("Không dùng được vị trí hiện tại. Bạn vẫn có thể tìm theo địa chỉ.");
    }
  }

  return (
    <div className="location-picker">
      <input
        aria-label="Địa chỉ thủ công"
        value={address}
        placeholder="Nhập địa chỉ hoặc khu vực"
        onChange={(event) => onAddressChange(event.target.value)}
      />
      <button type="button" onClick={locate}>
        Tìm quanh đây
      </button>
      {notice ? <p>{notice}</p> : null}
    </div>
  );
}
