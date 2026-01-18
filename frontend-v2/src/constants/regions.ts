export const KOL_REGIONS = [
    "Jakarta",
    "Bali",
    "Surabaya",
    "Bandung",
    "Yogyakarta",
    "Medan",
    "Semarang",
    "Makassar",
    "Indonesia (Other)",
    "Singapore",
    "Malaysia",
    "Thailand",
    "Vietnam",
    "Philippines",
    "Asia (Other)",
    "USA",
    "Europe",
    "International"
] as const;

export type KolRegion = typeof KOL_REGIONS[number];
