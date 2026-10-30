"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import PetitionView from "@/components/petition-view";
import type { Petition } from "@/lib/types";

export default function PetitionDialog({
  id,
  onClose,
  onCountChange,
  onPetitionChange,
}: {
  id: number;
  onClose: () => void;
  onCountChange: (id: number, count: number) => void;
  onPetitionChange?: (petition: Petition) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      titleId="petition-dialog-title"
      onClose={onClose}
      className="petition-dialog"
      busy={busy}
    >
      <PetitionView
        id={id}
        onCountChange={onCountChange}
        onPetitionChange={onPetitionChange}
        onBusyChange={setBusy}
      />
    </Modal>
  );
}
