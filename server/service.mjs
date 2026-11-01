import { validateInput } from "./validator.mjs";
import { fail } from "./errors.mjs";
export const meta = {
  slug: "fagulha",
  title: "FAGULHA",
  engine: "graphql-helix-ajv-dependency",
  default_input: {
    graph: "app: view, engine\nview: tokens\nengine: data\ndata:\ntokens:",
    root: "app",
  },
  presets: [
    {
      name: "Estúdio",
      input: {
        graph: "app: view, engine\nview: tokens\nengine: data\ndata:\ntokens:",
        root: "app",
      },
    },
    {
      name: "Ciclo",
      input: {
        graph: "app: view\nview: engine\nengine: view, data\ndata:",
        root: "engine",
      },
    },
    {
      name: "Produção",
      input: {
        graph:
          "site: ui, checkout\nui: tokens\ncheckout: cart, pricing\ncart: catalog\npricing: catalog\ncatalog:\ntokens:",
        root: "catalog",
      },
    },
  ],
  note: "Grafo abstrato declarado como módulo: dependência, dependência. Não lê arquivos, executa código, instala pacotes nem faz requisições externas. Até 16 módulos e 48 ligações.",
};
export function parseGraph(text) {
  const map = new Map(),
    label = /^[a-z][a-z0-9-]{0,15}$/;
  const lines = text.split(/\r?\n/).filter((x) => x.trim());
  if (lines.length > 16) fail("invalid_input", "No máximo 16 declarações.");
  for (const line of lines) {
    const pair = line.split(":");
    if (pair.length !== 2)
      fail(
        "invalid_input",
        "Use módulo: dependência, dependência em cada linha.",
      );
    const id = pair[0].trim(),
      deps = pair[1].trim() ? pair[1].split(",").map((x) => x.trim()) : [];
    if (
      !label.test(id) ||
      deps.some((x) => !label.test(x)) ||
      map.has(id) ||
      new Set(deps).size !== deps.length
    )
      fail(
        "invalid_input",
        "Identificadores únicos: letras minúsculas, números e hífen.",
      );
    map.set(id, deps);
  }
  for (const deps of [...map.values()])
    for (const id of deps) if (!map.has(id)) map.set(id, []);
  if (map.size > 16 || [...map.values()].reduce((s, v) => s + v.length, 0) > 48)
    fail("invalid_input", "Limite de 16 módulos e 48 dependências.");
  return map;
}
export function validate(raw) {
  const p = validateInput(raw),
    map = parseGraph(p.graph);
  if (!map.has(p.root))
    fail("invalid_input", "Escolha um módulo presente no grafo.");
  return p;
}
export function compute(raw) {
  const p = validate(raw),
    map = parseGraph(p.graph),
    ids = [...map.keys()].sort(),
    reverse = new Map(ids.map((id) => [id, []]));
  for (const [id, deps] of map)
    for (const dep of deps) reverse.get(dep).push(id);
  let counter = 0;
  const stack = [],
    index = new Map(),
    low = new Map(),
    on = new Set(),
    components = [];
  function visit(id) {
    index.set(id, counter);
    low.set(id, counter++);
    stack.push(id);
    on.add(id);
    for (const dep of map.get(id)) {
      if (!index.has(dep)) {
        visit(dep);
        low.set(id, Math.min(low.get(id), low.get(dep)));
      } else if (on.has(dep))
        low.set(id, Math.min(low.get(id), index.get(dep)));
    }
    if (low.get(id) === index.get(id)) {
      const c = [];
      let next;
      do {
        next = stack.pop();
        on.delete(next);
        c.push(next);
      } while (next !== id);
      components.push(c.sort());
    }
  }
  ids.forEach((id) => {
    if (!index.has(id)) visit(id);
  });
  const cycles = components.filter(
    (c) => c.length > 1 || map.get(c[0]).includes(c[0]),
  );
  const traverse = (graph) => {
    const seen = new Set([p.root]),
      queue = [p.root];
    for (let i = 0; i < queue.length; i++)
      for (const next of graph.get(queue[i]))
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
    return [...seen].sort();
  };
  const count = new Map(ids.map((id) => [id, map.get(id).length])),
    ready = ids.filter((id) => count.get(id) === 0),
    order = [];
  while (ready.length) {
    ready.sort();
    const id = ready.shift();
    order.push(id);
    for (const dependent of reverse.get(id)) {
      count.set(dependent, count.get(dependent) - 1);
      if (!count.get(dependent)) ready.push(dependent);
    }
  }
  const levels = new Map();
  for (const id of order)
    levels.set(
      id,
      map.get(id).length
        ? 1 + Math.max(...map.get(id).map((dep) => levels.get(dep) ?? 0))
        : 0,
    );
  const nodeRows = new Map(),
    nodes = ids.map((id) => {
      const layer = levels.get(id) ?? Math.max(1, ...levels.values()) + 1,
        row = nodeRows.get(layer) ?? 0;
      nodeRows.set(layer, row + 1);
      return {
        id,
        dependencies: map.get(id),
        dependents: reverse.get(id),
        cyclic: cycles.some((c) => c.includes(id)),
        layer,
        row,
      };
    });
  return {
    nodes,
    edges: ids.flatMap((id) => map.get(id).map((to) => ({ from: id, to }))),
    cycles,
    acyclic: cycles.length === 0,
    order,
    blocked: ids.filter((id) => !order.includes(id)),
    reachable: traverse(map),
    affected: traverse(reverse),
    root: p.root,
  };
}
export function exportResult(input) {
  const r = compute(input);
  return {
    type: "text/vnd.graphviz; charset=utf-8",
    extension: "dot",
    text:
      "digraph Fagulha {\n  rankdir=LR;\n" +
      r.nodes.map((n) => '  "' + n.id + '";').join("\n") +
      "\n" +
      r.edges.map((e) => '  "' + e.from + '" -> "' + e.to + '";').join("\n") +
      "\n}\n",
  };
}
export const service = { meta, validate, compute, export: exportResult };
