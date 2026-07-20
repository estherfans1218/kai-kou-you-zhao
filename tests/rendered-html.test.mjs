import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>开口有招/);
  assert.match(html, /class="phone-stage"/);
  assert.match(html, /招式广场/);
  assert.match(html, /真实局/);
  assert.match(html, /练习/);
  assert.doesNotMatch(html, /class="desktop-note"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the interface mobile-first at every viewport", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /desktop-note/);
  assert.match(css, /\.phone-stage\s*\{[^}]*width:\s*100%[^}]*max-width:\s*520px/s);
  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /@media \(min-width:\s*980px\)[\s\S]*\.app-shell\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*center/s);
  assert.match(css, /@media \(min-width:\s*980px\)[\s\S]*\.bottom-nav\s*\{[^}]*left:\s*50%/s);
});
