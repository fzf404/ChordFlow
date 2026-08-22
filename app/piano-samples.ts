const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const PIANO_SAMPLE_MIDIS = [
  21, 24, 27, 30, 33, 36, 39, 42, 45, 48,
  51, 54, 57, 60, 63, 66, 69, 72, 75, 78,
  81, 84, 87, 90, 93, 96, 99, 102, 105, 108,
] as const;

export function pianoSampleFile(midi: number): string {
  const pitch = PITCH_NAMES[midi % 12].replace("#", "%23");
  return `${pitch}${Math.floor(midi / 12) - 1}v6.mp3`;
}

export function nearestPianoSample(midi: number): number {
  return PIANO_SAMPLE_MIDIS.reduce((nearest, sample) =>
    Math.abs(sample - midi) < Math.abs(nearest - midi) ? sample : nearest,
  );
}
