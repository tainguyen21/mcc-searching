"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  listSources,
  startSourceJob,
  updateSource,
  type Source,
  type SourceJob,
} from "@/lib/api-client";

export function SourceJobs() {
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<Record<string, SourceJob>>({});
  const [message, setMessage] = useState("Đang tải nguồn dữ liệu...");
  const [busyId, setBusyId] = useState<string>();

  useEffect(() => {
    let active = true;

    void listSources()
      .then((nextSources) => {
        if (!active) {
          return;
        }
        setSources(nextSources);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setMessage(
          error instanceof ApiError && error.status === 403
            ? "Bạn không có quyền xem nguồn dữ liệu."
            : "Không thể tải nguồn dữ liệu.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  async function toggleSource(source: Source) {
    if (source.type === "facebook") {
      return;
    }

    setBusyId(source.id);
    setMessage("");
    try {
      const updated = await updateSource(source.id, { enabled: !source.enabled });
      setSources((current) => current.map((entry) => entry.id === source.id ? updated : entry));
    } catch {
      setMessage("Không thể cập nhật nguồn dữ liệu.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function runJob(source: Source) {
    if (source.type === "facebook") {
      return;
    }

    setBusyId(source.id);
    setMessage("");
    try {
      const job = await startSourceJob(source.id);
      setJobs((current) => ({ ...current, [source.id]: job }));
    } catch {
      setMessage("Không thể khởi tạo lượt nhập dữ liệu.");
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div className="admin-stack">
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <div className="source-list">
        {sources.map((source) => {
          const isBlocked = source.type === "facebook";
          const latestJob = jobs[source.id];
          return (
            <article className="source-item" key={source.id}>
              <div className="staging-item-head">
                <div>
                  <p className="eyebrow">{source.type}</p>
                  <h2>{source.displayName}</h2>
                </div>
                <span className={`status-chip ${source.enabled ? "is-enabled" : ""}`}>
                  {source.enabled ? "Đang bật" : "Đang tắt"}
                </span>
              </div>
              <p>{source.sourceUrl ?? "Chưa có URL nguồn."}</p>
              <dl>
                <div><dt>Chu kỳ</dt><dd>{source.schedule ?? "Chưa đặt"}</dd></div>
                <div><dt>Lưu trữ</dt><dd>{source.retentionDays} ngày</dd></div>
                <div><dt>Job gần nhất</dt><dd>{latestJob ? `Đang chạy: ${latestJob.id}` : "Chưa có dữ liệu job từ API"}</dd></div>
              </dl>
              {isBlocked ? (
                <p className="blocked-source">
                  Không khả dụng: Facebook Groups chưa có bằng chứng quyền truy cập chính thức cần thiết. Nguồn này luôn bị tắt.
                </p>
              ) : (
                <div className="admin-actions">
                  <button type="button" onClick={() => void toggleSource(source)} disabled={busyId === source.id}>
                    {source.enabled ? "Tắt nguồn" : "Bật nguồn"}
                  </button>
                  <button className="secondary-action" type="button" onClick={() => void runJob(source)} disabled={busyId === source.id || !source.enabled}>
                    Chạy job
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {sources.length === 0 && !message ? <p className="empty-copy">Chưa có nguồn dữ liệu nào.</p> : null}
    </div>
  );
}
