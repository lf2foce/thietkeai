export type themeType =
  | "Modern"
  | "Vintage"
  | "Minimalist"
  | "Professional"
  | "Tropical"
  | "Summer"
  | "Coastal"
  | "Industrial"
  | "Neoclassic"
  | "Tribal"
  | "Custom Style";

export type roomType =
  | "Living Room"
  | "Dining Room"
  | "Bedroom"
  | "Bathroom"
  | "Office"
  | "Gaming Room";

export type qualityType = "Standard - 1 credit" | "Pro - 2 credits";

export const themes: { name: themeType; image: string }[] = [
  { name: "Modern", image: "/theme-images/modern.png" },
  { name: "Summer", image: "/theme-images/summer.png" },
  { name: "Professional", image: "/theme-images/professional.png" },
  { name: "Tropical", image: "/theme-images/tropical.png" },
  { name: "Coastal", image: "/theme-images/coastal.png" },
  { name: "Vintage", image: "/theme-images/vintage.png" },
  { name: "Industrial", image: "/theme-images/industrial.png" },
  { name: "Neoclassic", image: "/theme-images/neoclassic.png" },
  { name: "Tribal", image: "/theme-images/tribal.png" },
];

export const rooms: roomType[] = [
  "Living Room",
  "Dining Room",
  "Office",
  "Bedroom",
  "Bathroom",
  "Gaming Room",
];

export const qualities: qualityType[] = ["Standard - 1 credit", "Pro - 2 credits"];
