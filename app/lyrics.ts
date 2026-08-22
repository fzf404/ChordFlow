export type LyricLine = {
  time: number;
  text: string;
};

const TIME_TAG = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;

export function parseLrc(source: string): LyricLine[] {
  return source
    .split(/\r?\n/)
    .flatMap((line) => {
      const text = line.replace(TIME_TAG, "").trim();
      if (!text) return [];
      return [...line.matchAll(TIME_TAG)].map((match) => ({
        time: Number(match[1]) * 60 + Number(match[2]),
        text,
      }));
    })
    .sort((left, right) => left.time - right.time);
}

export function lyricAt(lines: LyricLine[], time: number): LyricLine | undefined {
  let current: LyricLine | undefined;
  for (const line of lines) {
    if (line.time > time) break;
    current = line;
  }
  return current;
}
