import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
