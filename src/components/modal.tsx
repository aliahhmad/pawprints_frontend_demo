"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/icon";

export default function Modal({
  titleId,
  onClose,
  children,
  className = "",
  busy = false,
}: {
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`app-dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const bounds = ref.current.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          if (!busy) onClose();
      }}
    >
      <button
        type="button"
        className="btn dialog-close"
        aria-label="Close dialog"
        disabled={busy}
        onClick={onClose}
      >
        <Icon name="close" size={21} />
      </button>
      {children}
    </dialog>
  );
}
