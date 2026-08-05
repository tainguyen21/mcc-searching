"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onSubmit }: Props) {
  return (
    <form
      className="search-bar"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input
        aria-label="Tìm tên cửa hàng"
        value={value}
        placeholder="Tìm cửa hàng, thương hiệu hoặc MCC"
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" aria-label="Tìm kiếm" title="Tìm kiếm">
        Tìm
      </button>
    </form>
  );
}
