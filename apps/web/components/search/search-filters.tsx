"use client";

type Props = {
  mccCode: string;
  categoryId: string;
  radiusKm: string;
  province: string;
  onMccCodeChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onRadiusKmChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
};

export function SearchFilters(props: Props) {
  return (
    <div className="search-filters">
      <input
        aria-label="Mã MCC"
        value={props.mccCode}
        inputMode="numeric"
        maxLength={4}
        placeholder="MCC"
        onChange={(event) => props.onMccCodeChange(event.target.value)}
      />
      <input
        aria-label="Danh mục MCC"
        value={props.categoryId}
        placeholder="Danh mục"
        onChange={(event) => props.onCategoryIdChange(event.target.value)}
      />
      <select
        aria-label="Bán kính tìm kiếm"
        value={props.radiusKm}
        onChange={(event) => props.onRadiusKmChange(event.target.value)}
      >
        <option value="1">1 km</option>
        <option value="5">5 km</option>
        <option value="10">10 km</option>
        <option value="25">25 km</option>
        <option value="50">50 km</option>
      </select>
      <input
        aria-label="Tỉnh hoặc thành phố"
        value={props.province}
        placeholder="Tỉnh/thành"
        onChange={(event) => props.onProvinceChange(event.target.value)}
      />
    </div>
  );
}
