'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/old/navigation';
import './CreatePetitionButton.css';

const CreatePetitionButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    // This respects Next.js basePath automatically if you have one.
    router.push('/create');
  };

  return (
    <button
      type="button"
      className="floating-create-button"
      onClick={handleClick}
      aria-label="Create a new petition"
    >
      <Plus
        className="floating-create-button__icon"
        aria-hidden="true"
        focusable="false"
      />
    </button>
  );
};

export default CreatePetitionButton;
