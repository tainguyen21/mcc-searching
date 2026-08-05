import type { StoreDetail } from "@/lib/api-client";

type Props = {
  locations: StoreDetail["locations"];
};

export function ObservationTable({ locations }: Props) {
  return (
    <div className="store-locations">
      {locations.map((location) => (
        <section className="store-location" key={location.locationId}>
          <div>
            <h2>{location.displayName ?? location.address}</h2>
            <p>{location.address}</p>
            {location.province ? <p>{location.province}</p> : null}
            {location.latitude !== null && location.longitude !== null ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                rel="noreferrer"
                target="_blank"
              >
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </a>
            ) : (
              <p>Chưa có tọa độ bản đồ.</p>
            )}
          </div>
          {location.observations.length > 0 ? (
            <div className="observation-table-wrap">
              <table className="observation-table">
                <thead>
                  <tr>
                    <th>MCC</th>
                    <th>Kênh</th>
                    <th>Ngân hàng</th>
                    <th>Nguồn</th>
                    <th>Ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {location.observations.map((observation) => (
                    <tr
                      key={`${location.locationId}-${observation.mccCode}-${observation.channel}-${observation.observedAt ?? "unknown"}`}
                    >
                      <td>
                        <strong>{observation.mccCode}</strong>
                        <span>{observation.mccName}</span>
                      </td>
                      <td>{observation.channel === "offline" ? "Tại cửa hàng" : "Trực tuyến"}</td>
                      <td>{observation.issuerBank ?? "Không rõ"}</td>
                      <td>{observation.sourceName}</td>
                      <td>{observation.observedAt ? new Intl.DateTimeFormat("vi-VN").format(new Date(observation.observedAt)) : "Không rõ"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-copy">Chưa có quan sát MCC được duyệt cho địa điểm này.</p>
          )}
        </section>
      ))}
    </div>
  );
}
