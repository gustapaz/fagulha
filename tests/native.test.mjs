import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi } from "../server/api.mjs";
import { service } from "../server/service.mjs";
const api = createApi({});
const request = (path, body) =>
  api(
    new Request("https://demo.local" + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
const query =
  "query($graph:String!,$root:String!){analyze(graph:$graph,root:$root){acyclic order cycles reachable affected blocked root}}";
test("Helix GraphQL resolves the real dependency analysis", async () => {
  const r = await request("/api/graphql", {
      query,
      variables: service.meta.default_input,
    }),
    body = await r.json(),
    expected = service.compute(service.meta.default_input);
  assert.equal(r.status, 200);
  assert.equal(body.errors, undefined);
  for (const key of [
    "acyclic",
    "order",
    "cycles",
    "reachable",
    "affected",
    "blocked",
    "root",
  ])
    assert.deepEqual(body.data.analyze[key], expected[key]);
});
test("multiple top-level analyses are rejected to bound query work", async () => {
  assert.equal(
    (
      await request("/api/graphql", {
        query:
          '{a:analyze(graph:"a:",root:"a"){root} b:analyze(graph:"a:",root:"a"){root}}',
      })
    ).status,
    400,
  );
});
test(
  "oversized native requests terminate with 413, including cloned bodies",
  { timeout: 2000 },
  async () => {
    const r = await api(
      new Request("https://demo.local/api/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "x".repeat(17000),
      }),
    );
    assert.equal(r.status, 413);
  },
);
