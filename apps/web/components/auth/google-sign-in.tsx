"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  getCurrentUser,
  signInWithGoogle,
  signOut,
  type CurrentUser,
} from "@/lib/api-client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select: boolean;
            cancel_on_tap_outside: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              type: "standard";
              text: "signin_with";
              shape: "rectangular";
            },
          ) => void;
        };
      };
    };
  }
}

type Props = {
  user?: CurrentUser | null;
  onSessionChange: (user: CurrentUser | null) => void;
};

export function GoogleSignIn({ user, onSessionChange }: Props) {
  const button = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const completeSignIn = useCallback(async (credential: string) => {
    setIsLoading(true);
    setMessage("");
    try {
      await signInWithGoogle(credential);
      onSessionChange(await getCurrentUser());
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? "Không thể hoàn tất đăng nhập. Hãy kiểm tra cấu hình Google rồi thử lại."
          : "Không thể kết nối dịch vụ đăng nhập. Hãy thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [onSessionChange]);

  useEffect(() => {
    if (user || !clientId || !button.current) {
      return;
    }

    const initialize = () => {
      if (!button.current || !window.google) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: (response) => {
          if (!response.credential) {
            setMessage("Google không trả về thông tin đăng nhập. Hãy thử lại.");
            return;
          }
          void completeSignIn(response.credential);
        },
      });
      button.current.replaceChildren();
      window.google.accounts.id.renderButton(button.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
        shape: "rectangular",
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", initialize);
      if (window.google) {
        initialize();
      }
      return () => existingScript.removeEventListener("load", initialize);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.addEventListener("load", initialize);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", initialize);
  }, [clientId, completeSignIn, user]);

  async function handleSignOut() {
    setIsLoading(true);
    setMessage("");
    try {
      await signOut();
      onSessionChange(null);
    } catch {
      setMessage("Không thể đăng xuất lúc này. Hãy thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  if (user) {
    return (
      <div className="session-control">
        <span>{user.displayName ?? "Tài khoản Google"}</span>
        <button type="button" onClick={() => void handleSignOut()} disabled={isLoading}>
          Đăng xuất
        </button>
        {message ? <p className="form-message error">{message}</p> : null}
      </div>
    );
  }

  if (!clientId) {
    return <p className="form-message">Đăng nhập Google chưa được cấu hình.</p>;
  }

  return (
    <div className="google-sign-in">
      <div ref={button} aria-label="Đăng nhập bằng Google" />
      {isLoading ? <p className="form-message">Đang xác thực tài khoản...</p> : null}
      {message ? <p className="form-message error">{message}</p> : null}
    </div>
  );
}
