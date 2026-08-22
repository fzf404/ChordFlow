import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";

test("defines ChordFlow metadata and icons", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(layout, /title: "ChordFlow/);
  assert.match(layout, /chordflow-icon\.png/);
});

test("ships every catalog data directory and piano-sample license", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const popIds = [...page.matchAll(/id:"(\d{3})"[^\n]+source:"pop909"/g)].map(
    ([, id]) => id,
  );
  const classicalPaths = [...page.matchAll(/midi:"(\/data\/classical\/[^"]+)"/g)].map(
    ([, path]) => path,
  );

  assert.ok(popIds.length > 0, "the popular-song catalog must not be empty");
  assert.ok(classicalPaths.length > 0, "the classical catalog must not be empty");

  await Promise.all([
    ...popIds.map((id) =>
      access(new URL(`../public/data/pop909/${id}/${id}.mid`, import.meta.url)),
    ),
    ...classicalPaths.map((path) =>
      access(new URL(`../public${path}`, import.meta.url)),
    ),
    access(new URL("../public/audio/piano/LICENSE.txt", import.meta.url)),
  ]);
});

test("maps the full piano range to packaged samples", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const sampleList = page.match(/const SAMPLE_MIDIS=\[([^\]]+)\]/)?.[1];
  assert.ok(sampleList, "the piano sample map must be declared");

  const sampleMidis = sampleList.split(",").map(Number);
  assert.equal(sampleMidis[0], 21, "the sample map must begin at A0");
  assert.equal(sampleMidis.at(-1), 108, "the sample map must end at C8");
  assert.ok(
    sampleMidis.slice(1).every((midi, index) => midi - sampleMidis[index] <= 3),
    "adjacent piano samples must be at most three semitones apart",
  );

  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const expectedFiles = sampleMidis.map(
    (midi) => `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}v6.mp3`,
  );
  const sampleDirectory = new URL("../public/audio/piano/", import.meta.url);
  const packagedFiles = (await readdir(sampleDirectory))
    .filter((file) => file.endsWith(".mp3"))
    .sort();
  assert.deepEqual(packagedFiles, [...expectedFiles].sort());

  await Promise.all(
    expectedFiles.map(async (file) => {
      const encodedFile = file.replace("#", "%23");
      const fileUrl = new URL(encodedFile, sampleDirectory);
      await access(fileUrl);
      assert.ok((await stat(fileUrl)).size > 10_000, `${file} must contain a complete sample`);
    }),
  );
});
