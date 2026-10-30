"use client";

import { useEffect, useState } from "react";
import { getSiteAlert } from "@/lib/demo-client";
import Icon from "@/components/icon";
import SiteNoticeDialog from "@/components/site-notice-dialog";

export default function SiteNotice({
  petitionOpen,
}: {
  petitionOpen: boolean;
}) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    getSiteAlert(controller.signal)
      .then((data) => {
        if (
          controller.signal.aborted ||
          !data.alert_enabled ||
          !data.alert_message
        )
          return;
        setMessage(data.alert_message);
        let dismissed = false;
        try {
          dismissed = sessionStorage.getItem("sg-alert-dismissed") === "true";
        } catch {
          /* The notice also works without storage. */
        }
        if (!dismissed) setOpen(true);
      })
      .catch(() => {
        /* Optional notice failure must not block browsing. */
      });
    return () => controller.abort();
  }, []);
  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("sg-alert-dismissed", "true");
    } catch {
      /* Dismiss for this mount. */
    }
  };
  if (!message) return null;
  return (
    <>
      <button
        className="notice-trigger btn btn-outline-secondary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon name="bell" />
        <span>SG notice</span>
      </button>
      {open && !petitionOpen && (
        <SiteNoticeDialog message={message} onClose={dismiss} />
      )}
    </>
  );
}
