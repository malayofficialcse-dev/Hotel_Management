type IconName =
  | "bed"
  | "bell"
  | "chevron"
  | "map-pin"
  | "calendar"
  | "search"
  | "heart"
  | "check"
  | "wallet"
  | "support"
  | "arrow-right"
  | "arrow-up-right"
  | "shield"
  | "mail"
  | "download"
  | "calendar-plus"
  | "sun"
  | "sparkles"
  | "share"
  | "info"
  | "lock"
  | "credit-card"
  | "phone"
  | "wifi"
  | "coffee"
  | "leaf"
  | "car"
  | "plane"
  | "user"
  | "sliders"
  | "logout";

const iconAssets: Record<IconName, string> = {
  bed: "0ced3.svg",
  bell: "4511c.svg",
  chevron: "8163c.svg",
  "map-pin": "4dd71.svg",
  calendar: "d4c34.svg",
  search: "93abf.svg",
  heart: "f9e53.svg",
  check: "a244b.svg",
  wallet: "98672.svg",
  support: "3aa31.svg",
  "arrow-right": "86b56.svg",
  "arrow-up-right": "b091a.svg",
  shield: "1b8d7.svg",
  mail: "541f8.svg",
  download: "76632.svg",
  "calendar-plus": "6bf73.svg",
  sun: "0b1cb.svg",
  sparkles: "39a28.svg",
  share: "461e4.svg",
  info: "7e865.svg",
  lock: "d3884.svg",
  "credit-card": "09d8d.svg",
  phone: "4cce2.svg",
  wifi: "dd803.svg",
  coffee: "fe836.svg",
  leaf: "528ae.svg",
  car: "241f3.svg",
  plane: "59b22.svg",
  user: "dc83b.svg",
  sliders: "0f313.svg",
  logout: "521fd.svg",
};

export function FigmaIcon({
  name,
  className = "h-4 w-4",
  alt = "",
}: {
  name: IconName;
  className?: string;
  alt?: string;
}) {
  return (
    // The local SVGs are the original vector assets from the supplied Figma file.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/figma/${iconAssets[name]}`}
      alt={alt}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
