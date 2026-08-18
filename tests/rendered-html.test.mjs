import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the ChordFlow application shell", async () => {
  const response = await render();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>ChordFlow/);
  assert.match(html, /chordflow-icon\.png/);
  assert.doesNotMatch(html, /Your site is taking shape|vinext-starter/);
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
