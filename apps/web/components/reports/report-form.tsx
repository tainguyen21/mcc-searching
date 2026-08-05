"use client";

import { FormEvent, useEffect, useState } from "react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import {
  ApiError,
  getCurrentUser,
  submitReport,
  type CurrentUser,
  type ReportInput,
} from "@/lib/api-client";

const initialInput: ReportInput = {
  merchantName: "",
  address: "",
  mccCode: "",
  issuerBank: "",
  channel: "offline",
};

export function ReportForm() {
  const [user, setUser] = useState<CurrentUser | null>();
  const [input, setInput] = useState<ReportInput>(initialInput);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage("");

    if (!user) {
      setErrors(["Đăng nhập Google để gửi báo cáo."]);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReport(input);
      setMessage(
        result.duplicate
          ? "Báo cáo tương tự đã được ghi nhận và đang chờ duyệt."
          : "Báo cáo đã được gửi và đang chờ quản trị viên duyệt.",
      );
      setInput(initialInput);
    } catch (error) {
      setErrors(
        error instanceof ApiError
          ? error.details.length > 0
            ? error.details
            : [error.message]
          : ["Không thể gửi báo cáo. Hãy thử lại."],
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="content-panel report-panel">
      <div className="panel-heading">
        <p className="eyebrow">Cộng đồng</p>
        <h1>Báo cáo MCC</h1>
        <p>Thông tin mới sẽ chỉ xuất hiện công khai sau khi được duyệt.</p>
      </div>

      {user === undefined ? (
        <p className="form-message">Đang kiểm tra phiên đăng nhập...</p>
      ) : (
        <GoogleSignIn user={user} onSessionChange={setUser} />
      )}

      <form className="report-form" onSubmit={(event) => void submit(event)}>
        <label>
          Tên cửa hàng
          <input
            required
            maxLength={255}
            value={input.merchantName}
            onChange={(event) => setInput({ ...input, merchantName: event.target.value })}
          />
        </label>
        <label>
          Địa chỉ
          <input
            required
            maxLength={500}
            value={input.address}
            onChange={(event) => setInput({ ...input, address: event.target.value })}
          />
        </label>
        <label>
          Mã MCC
          <input
            required
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={input.mccCode}
            onChange={(event) => setInput({ ...input, mccCode: event.target.value.replace(/\D/g, "") })}
          />
        </label>
        <label>
          Ngân hàng phát hành
          <input
            required
            maxLength={255}
            value={input.issuerBank}
            onChange={(event) => setInput({ ...input, issuerBank: event.target.value })}
          />
        </label>
        <fieldset>
          <legend>Kênh thanh toán</legend>
          <label>
            <input
              type="radio"
              name="channel"
              value="offline"
              checked={input.channel === "offline"}
              onChange={() => setInput({ ...input, channel: "offline" })}
            />
            Tại cửa hàng
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="online"
              checked={input.channel === "online"}
              onChange={() => setInput({ ...input, channel: "online" })}
            />
            Trực tuyến
          </label>
        </fieldset>
        {errors.length > 0 ? (
          <div className="form-message error" role="alert">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}
        {message ? <p className="form-message success" role="status">{message}</p> : null}
        <button type="submit" disabled={!user || isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
        </button>
      </form>
    </section>
  );
}
