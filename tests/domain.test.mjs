import { test } from "node:test";
import assert from "node:assert/strict";
import { service } from "../server/service.mjs";

test("topological order places every dependency before its consumer", () => {
  const r = service.compute(service.meta.default_input);
  assert.equal(r.acyclic, true);
  for (const e of r.edges)
    assert.ok(r.order.indexOf(e.to) < r.order.indexOf(e.from));
});
test("strongly connected cycle detected precisely", () => {
  const r = service.compute(service.meta.presets[1].input);
  assert.deepEqual(r.cycles, [["engine", "view"]]);
  assert.equal(r.acyclic, false);
  assert.ok(r.blocked.includes("app"));
});
test("forward and reverse reachability have different meanings", () => {
  const r = service.compute({
    graph: "app: ui\nui: tokens\ntokens:",
    root: "ui",
  });
  assert.deepEqual(r.reachable, ["tokens", "ui"]);
  assert.deepEqual(r.affected, ["app", "ui"]);
});
test("referenced leaves are materialized and self loops are cycles", () => {
  const r = service.compute({ graph: "app: leaf, app", root: "app" });
  assert.equal(r.nodes.length, 2);
  assert.deepEqual(r.cycles, [["app"]]);
});
test("DOT export is original declarative data, not executable code", () => {
  const e = service.export(service.meta.default_input);
  assert.equal(e.extension, "dot");
  assert.match(e.text, /digraph Fagulha/);
  assert.match(e.text, /"app" -> "view"/);
});
test("bad grammar duplicate declarations unknown roots and extra fields rejected", () => {
  for (const x of [
    { graph: "app=>ui" },
    { graph: "app:\napp:" },
    { root: "absent" },
    { graph: "app: ../../private" },
    { extra: 1 },
  ])
    assert.throws(() =>
      service.compute({ ...service.meta.default_input, ...x }),
    );
});
