"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const images = Array.from(
  { length: 9 },
  (_, index) => `/campus/carousel_${index}.${index < 4 ? "png" : "jpg"}`,
);

export default function CampusBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || reduced.matches) return;
    const interval = setInterval(
      () => setIndex((value) => (value + 1) % images.length),
      8000,
    );
    return () => clearInterval(interval);
  }, [paused]);
  return (
    <div
      className="campus-banner"
      aria-label="RIT campus community photos"
      aria-roledescription="carousel"
    >
      <Image
        src={images[index]}
        alt="RIT Student Government and campus community"
        fill
        sizes="(max-width: 767px) 100vw, 340px"
      />
      <div className="campus-banner-controls">
        <span>OUR CAMPUS, TOGETHER.</span>
        <div>
          <button
            type="button"
            onClick={() => setIndex((value) => (value + 8) % images.length)}
            aria-label="Previous campus photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play campus photos" : "Pause campus photos"}
          >
            {paused ? "Play" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => setIndex((value) => (value + 1) % images.length)}
            aria-label="Next campus photo"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
