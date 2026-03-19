"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";

type ToastType = "success" | "error" | "info";

type ToastInput = {
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  durationMs: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const toast: ToastItem = {
      id: makeToastId(),
      title: input.title,
      message: input.message,
      type: input.type || "info",
      durationMs: input.durationMs ?? 4200,
    };

    setToasts((prev) => [toast, ...prev].slice(0, 4));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, toast.durationMs);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [onClose, toast.durationMs]);

  return (
    <article className={`toast-card toast-${toast.type}`}>
      <button type="button" className="toast-close" aria-label="Close notification" onClick={onClose}>
        x
      </button>

      <div className="toast-body">
        <div className="toast-icon-wrap" aria-hidden="true">
          <FontAwesomeIcon icon={getToastIcon(toast.type)} className="toast-icon" />
        </div>

        <div className="toast-content">
          {toast.title ? <p className="toast-title">{toast.title}</p> : null}
          <p className="toast-message">{toast.message}</p>
        </div>
      </div>

      <div className="toast-progress-track">
        <div className="toast-progress-fill" style={{ animationDuration: `${toast.durationMs}ms` }} />
      </div>
    </article>
  );
}

function getToastIcon(type: ToastType) {
  if (type === "success") {
    return faCircleCheck;
  }
  if (type === "error") {
    return faCircleXmark;
  }
  return faCircleInfo;
}
