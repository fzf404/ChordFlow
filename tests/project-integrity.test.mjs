import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { lyricAt, parseLrc } from "../app/lyrics.ts";
import { PIANO_SAMPLE_MIDIS, pianoSampleFile } from "../app/piano-samples.ts";
import { fetchResource } from "../app/resource.ts";

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

  const popDirectory = new URL("../public/data/pop909/", import.meta.url);
  const classicalDirectory = new URL("../public/data/classical/", import.meta.url);
  const packagedPopIds = (await readdir(popDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const packagedClassicalFiles = (await readdir(classicalDirectory))
    .filter((file) => file.endsWith(".mid"))
    .sort();

  assert.deepEqual(packagedPopIds, [...popIds].sort(), "POP909 must not contain unused songs");
  assert.deepEqual(
    packagedClassicalFiles,
    classicalPaths.map((path) => path.split("/").at(-1)).sort(),
    "the classical directory must not contain unused scores",
  );

  await Promise.all(
    popIds.map(async (id) => {
      const files = (await readdir(new URL(`${id}/`, popDirectory))).sort();
      assert.deepEqual(files, [`${id}.mid`, "chord_midi.txt", "key_audio.txt"]);
    }),
  );

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
  assert.equal(PIANO_SAMPLE_MIDIS[0], 21, "the sample map must begin at A0");
  assert.equal(PIANO_SAMPLE_MIDIS.at(-1), 108, "the sample map must end at C8");
  assert.ok(
    PIANO_SAMPLE_MIDIS.slice(1).every((midi, index) => midi - PIANO_SAMPLE_MIDIS[index] <= 3),
    "adjacent piano samples must be at most three semitones apart",
  );

  const expectedFiles = PIANO_SAMPLE_MIDIS.map((midi) => decodeURIComponent(pianoSampleFile(midi)));
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

test("rejects missing resources with the requested path and status", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 404 });
  try {
    await assert.rejects(fetchResource("/missing.mid"), /\/missing\.mid \(404\)/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses LRC timestamps instead of fixed lyric intervals", () => {
  const lines = parseLrc("[00:01.50]第一句\n[00:03.25][00:05.00]第二句");
  assert.deepEqual(lines, [
    { time: 1.5, text: "第一句" },
    { time: 3.25, text: "第二句" },
    { time: 5, text: "第二句" },
  ]);
  assert.equal(lyricAt(lines, 4)?.text, "第二句");
  assert.equal(lyricAt(lines, 1), undefined);
});
