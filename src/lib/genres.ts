export const GENRES = [
  "Rock",
  "Pop",
  "Hip-Hop",
  "Jazz",
  "Classical",
  "Electronic",
  "R&B",
  "Country",
  "Metal",
  "Reggae",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRE_COLORS: Record<Genre, string> = {
  Rock: "oklch(0.7 0.22 25)",
  Pop: "oklch(0.78 0.2 340)",
  "Hip-Hop": "oklch(0.75 0.2 60)",
  Jazz: "oklch(0.78 0.18 200)",
  Classical: "oklch(0.75 0.15 140)",
  Electronic: "oklch(0.7 0.22 305)",
  "R&B": "oklch(0.72 0.2 15)",
  Country: "oklch(0.78 0.17 80)",
  Metal: "oklch(0.55 0.12 275)",
  Reggae: "oklch(0.75 0.2 150)",
};

/** Deterministic mock predictor keyed off filename + audio stats so the same file gives the same result. */
export function mockPredict(seed: string): { top: Genre; confidence: number; all: Record<Genre, number> } {
  // Simple hash
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = (n: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295 + n * 0;
  };

  const raw = GENRES.map((g) => ({ g, v: 0.05 + rand(0) * 0.95 }));
  // Bias the top by amplifying max
  raw.sort((a, b) => b.v - a.v);
  raw[0].v = raw[0].v * 1.6 + 0.5;
  const sum = raw.reduce((s, r) => s + r.v, 0);
  const scores = {} as Record<Genre, number>;
  for (const r of raw) scores[r.g] = r.v / sum;
  const entries = (Object.entries(scores) as [Genre, number][]).sort((a, b) => b[1] - a[1]);
  return { top: entries[0][0], confidence: entries[0][1], all: scores };
}
