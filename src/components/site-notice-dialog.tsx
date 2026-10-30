"use client";

import Modal from "@/components/modal";

export default function SiteNoticeDialog({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal
      titleId="notice-title"
      onClose={onClose}
      className="notice-dialog"
    >
      <span className="eyebrow">CAMPUS NOTICE</span>
      <h2 id="notice-title">A note from Student Government</h2>
      <p className="notice-message">{message}</p>
      <button type="button" className="btn btn-primary" onClick={onClose}>
        Got it
      </button>
    </Modal>
  );
}
