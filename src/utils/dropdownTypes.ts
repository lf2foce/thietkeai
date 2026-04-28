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
  | "Tribal";

export type roomType =
  | "Living Room"
  | "Dining Room"
  | "Bedroom"
  | "Bathroom"
  | "Office"
  | "Gaming Room";

export type qualityType = "Free" | "Pro - 2 credits";

export const themes: { name: themeType; image: string }[] = [
  { name: "Modern", image: "/theme-images/modern.jpg" },
  { name: "Summer", image: "/theme-images/summer.png" },
  { name: "Professional", image: "/theme-images/professional.jpg" },
  { name: "Tropical", image: "/theme-images/tropical.jpg" },
  { name: "Coastal", image: "/theme-images/coastal.png" },
  { name: "Vintage", image: "/theme-images/vintage.jpg" },
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

export const qualities: qualityType[] = ["Free", "Pro - 2 credits"];
