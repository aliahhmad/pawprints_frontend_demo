import type { Tag } from "@/lib/types";

export default function PetitionTag({ tag }: { tag: Tag }) {
  const background =
    typeof tag.color === "string" &&
    /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(tag.color)
      ? tag.color
      : "#e9ecef";
  const hex = background.slice(1);
  const expanded =
    hex.length === 3 ? [...hex].map((value) => value + value).join("") : hex;
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(expanded.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return (
    <span
      className="petition-tag"
      title={tag.description || undefined}
      style={{
        backgroundColor: background,
        borderColor: background,
        color: whiteContrast > blackContrast ? "#fff" : "#000",
      }}
    >
      {tag.name}
    </span>
  );
}
