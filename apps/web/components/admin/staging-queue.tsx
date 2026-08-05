"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  decideObservation,
  listStagingObservations,
  mergeLocations,
  type StagingObservation,
} from "@/lib/api-client";

export function StagingQueue() {
  const [items, setItems] = useState<StagingObservation[]>([]);
  const [message, setMessage] = useState("Đang tải hàng chờ...");
  const [busyId, setBusyId] = useState<string>();
  const [mergeInput, setMergeInput] = useState({
    duplicateLocationId: "",
    canonicalLocationId: "",
    reason: "",
  });

  useEffect(() => {
    let active = true;

    void listStagingObservations()
      .then((nextItems) => {
        if (!active) {
          return;
        }
        setItems(nextItems);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setMessage(
          error instanceof ApiError && error.status === 403
            ? "Bạn không có quyền xem hàng chờ."
            : "Không thể tải hàng chờ.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  async function load() {
    try {
      setItems(await listStagingObservations());
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 403
          ? "Bạn không có quyền xem hàng chờ."
          : "Không thể tải hàng chờ.",
      );
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setMessage("");
    try {
      await decideObservation(id, { status });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setMessage("Không thể lưu quyết định. Hãy thử lại.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function submitMerge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await mergeLocations(mergeInput);
      setMergeInput({ duplicateLocationId: "", canonicalLocationId: "", reason: "" });
      setMessage("Đã chuyển dữ liệu địa điểm vào bản ghi chuẩn.");
      await load();
    } catch {
      setMessage("Không thể gộp địa điểm. Kiểm tra các mã địa điểm rồi thử lại.");
    }
  }

  return (
    <div className="admin-stack">
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <div className="staging-list">
        {items.map((item) => (
          <article className="staging-item" key={item.id}>
            <div className="staging-item-head">
              <div>
                <p className="eyebrow">Ứng viên MCC</p>
                <h2>{item.mccCodeId}</h2>
              </div>
              <span className="status-chip">Chờ duyệt</span>
            </div>
            <dl>
              <div><dt>Quan sát</dt><dd>{item.id}</dd></div>
              <div><dt>Địa điểm</dt><dd>{item.merchantLocationId ?? "Chưa ghép địa điểm"}</dd></div>
              <div><dt>Nguồn</dt><dd>{item.sourceId}</dd></div>
              <div><dt>Permalink</dt><dd>{item.sourceItemId ?? "Không có permalink từ API"}</dd></div>
              <div><dt>Ngân hàng</dt><dd>{item.issuerBank ?? "Không rõ"}</dd></div>
              <div><dt>Kênh</dt><dd>{item.channel === "offline" ? "Tại cửa hàng" : "Trực tuyến"}</dd></div>
            </dl>
            {item.evidenceSnippet ? <p className="evidence">{item.evidenceSnippet}</p> : null}
            <div className="admin-actions">
              <button
                type="button"
                onClick={() => void decide(item.id, "approved")}
                disabled={busyId === item.id}
              >
                Duyệt
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => void decide(item.id, "rejected")}
                disabled={busyId === item.id}
              >
                Từ chối
              </button>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && !message ? <p className="empty-copy">Không có ứng viên đang chờ duyệt.</p> : null}

      <form className="merge-form" onSubmit={(event) => void submitMerge(event)}>
        <div>
          <p className="eyebrow">Gộp dữ liệu</p>
          <h2>Gộp địa điểm trùng lặp</h2>
        </div>
        <label>
          Mã địa điểm trùng
          <input
            required
            value={mergeInput.duplicateLocationId}
            onChange={(event) => setMergeInput({ ...mergeInput, duplicateLocationId: event.target.value })}
          />
        </label>
        <label>
          Mã địa điểm chuẩn
          <input
            required
            value={mergeInput.canonicalLocationId}
            onChange={(event) => setMergeInput({ ...mergeInput, canonicalLocationId: event.target.value })}
          />
        </label>
        <label>
          Lý do
          <input
            value={mergeInput.reason}
            onChange={(event) => setMergeInput({ ...mergeInput, reason: event.target.value })}
          />
        </label>
        <button type="submit">Gộp địa điểm</button>
      </form>
    </div>
  );
}
