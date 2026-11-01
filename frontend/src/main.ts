import { run } from "@cycle/run";
import { makeDOMDriver, h } from "@cycle/dom";
import xs from "xstream";
import { model } from "./model";
import { canvasStage } from "./canvas";
import { motionToggle } from "./client";
let emit = () => {};
const stage = canvasStage(
  document.querySelector<HTMLCanvasElement>("#cables")!,
  (c, w, ht, t, r) => {
    c.clearRect(0, 0, w, ht);
    if (!r) return false;
    const layers = Math.max(1, ...r.nodes.map((n: any) => n.layer)),
      counts = new Map<number, number>();
    r.nodes.forEach((n: any) =>
      counts.set(n.layer, Math.max(counts.get(n.layer) || 0, n.row + 1)),
    );
    const point = (id: string) => {
      const n = r.nodes.find((n: any) => n.id === id);
      return {
        x: 70 + (n.layer / layers) * (w - 140),
        y: ht / 2 + (n.row - ((counts.get(n.layer) || 1) - 1) / 2) * 90,
      };
    };
    r.edges.forEach((e: any, i: number) => {
      const a = point(e.from),
        b = point(e.to),
        active = r.affected.includes(e.from) && r.affected.includes(e.to);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.bezierCurveTo(a.x - 60, a.y, b.x + 60, b.y, b.x, b.y);
      c.strokeStyle = active ? "#ff6a2f" : "#696967";
      c.lineWidth = 2;
      c.stroke();
      if (active) {
        c.setLineDash([3, 22]);
        c.lineDashOffset = t ? -t / 35 : 0;
        c.strokeStyle = "#ffe6ad";
        c.stroke();
        c.setLineDash([]);
      }
    });
    r.nodes.forEach((n: any) => {
      const p = point(n.id),
        active = n.id === r.root;
      c.fillStyle = n.cyclic ? "#792e28" : active ? "#f76a30" : "#343532";
      c.fillRect(p.x - 45, p.y - 19, 90, 38);
      c.strokeStyle = active ? "#ffce96" : "#8b8c86";
      c.lineWidth = 1;
      c.strokeRect(p.x - 45, p.y - 19, 90, 38);
      c.fillStyle = "#f3f0e5";
      c.textAlign = "center";
      c.font = "10px monospace";
      c.fillText(n.id, p.x, p.y + 4);
    });
    return true;
  },
);
const a = model(
    "fagulha",
    () => emit(),
    (r) => stage.set(r),
  ),
  d = a.d;
a.api.compute = async (input) => {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "query($graph:String!,$root:String!){analyze(graph:$graph,root:$root){nodes{id dependencies dependents cyclic layer row}edges{from to}cycles acyclic order blocked reachable affected root}}",
      variables: input,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length)
    throw new Error(
      result.errors?.[0]?.message ||
        result.message ||
        "O analisador não respondeu.",
    );
  return result.data.analyze;
};
const button = (text: string, action: string, extra: any = {}) =>
  h(
    "button",
    { attrs: { "data-action": action, disabled: d.busy, ...extra } },
    text,
  );
const field = (label: string, node: any) => h("label", [label, node]);
function view() {
  return h("div.workbench", [
    h("div.editor-head", [
      h("span", "01 / DECLARAR"),
      h("span", "GRAPHQL · ANÁLISE ESTÁTICA"),
    ]),
    d.catalog
      ? h("div", [
          field(
            "Módulos e dependências",
            h(
              "textarea",
              {
                attrs: {
                  id: "source",
                  "aria-label": "Módulos e dependências",
                  maxlength: 2400,
                  spellcheck: "false",
                  disabled: d.busy,
                },
                props: { value: d.input.graph },
              },
              [],
            ),
          ),
          h("div.root-row", [
            field(
              "Módulo em foco",
              h("input", {
                attrs: {
                  id: "root-node",
                  "aria-label": "Módulo em foco",
                  maxlength: 16,
                  disabled: d.busy,
                },
                props: { value: d.input.root },
              }),
            ),
            button("Analisar circuito ↗", "compute"),
          ]),
          h(
            "div.presets",
            d.catalog.presets.map((p: any, i: number) =>
              button(p.name + " ↗", "preset", { "data-index": i }),
            ),
          ),
        ])
      : button("Tentar conectar", "retry"),
    h("p.status", { attrs: { role: "status" } }, d.error || d.status),
    d.result
      ? h("div.analysis", [
          h("span", "02 / LER O IMPACTO"),
          h(
            "h2",
            d.result.acyclic
              ? "Tudo conectado. Sem ciclos."
              : "O circuito volta a si.",
          ),
          h("div.stats", [
            h("p", [h("strong", String(d.result.nodes.length)), "módulos"]),
            h("p", [h("strong", String(d.result.edges.length)), "ligações"]),
            h("p", [h("strong", String(d.result.affected.length)), "afetados"]),
          ]),
          h(
            "p",
            "Se " + d.result.root + " mudar: " + d.result.affected.join(" → "),
          ),
          h("p", "Dependências alcançadas: " + d.result.reachable.join(", ")),
          h("h3", "Ordem segura de construção"),
          h(
            "p.order",
            d.result.order.length
              ? d.result.order.join(" → ")
              : "Nenhum módulo pode ser construído.",
          ),
          d.result.cycles.length
            ? h(
                "p.cycle",
                "Ciclos: " +
                  d.result.cycles.map((x: any) => x.join(" ↔ ")).join(" / "),
              )
            : null,
          d.result.blocked.length
            ? h("p", "Bloqueados: " + d.result.blocked.join(", "))
            : null,
          h("details", [
            h("summary", "Todas as dependências em texto"),
            ...d.result.nodes.map((n: any) =>
              h(
                "p",
                { key: n.id },
                n.id +
                  ": " +
                  (n.dependencies.join(", ") || "nenhuma") +
                  " · consumidores: " +
                  (n.dependents.join(", ") || "nenhum"),
              ),
            ),
          ]),
        ])
      : null,
    h("details.archive", [
      h("summary", "03 / GUARDAR O CIRCUITO"),
      field(
        "Nome do circuito",
        h("input", {
          attrs: {
            id: "title",
            "aria-label": "Nome do circuito",
            maxlength: 48,
          },
          props: { value: d.title },
        }),
      ),
      button(
        d.current && d.owns ? "Salvar alterações" : "Guardar circuito",
        "save",
        { disabled: d.busy || !d.result },
      ),
      d.current
        ? h("div", [
            button("Reler do banco", "reload"),
            button("Exportar DOT ↓", "export"),
            d.owns
              ? button(
                  d.current.published ? "Encerrar link" : "Criar link",
                  "share",
                )
              : null,
            button("Novo circuito", "fresh"),
          ])
        : null,
      d.link
        ? h(
            "a",
            { attrs: { href: d.link, target: "_blank", rel: "noreferrer" } },
            "Abrir circuito compartilhado ↗",
          )
        : null,
      h(
        "small",
        "Nenhum código é executado. Retenção de 7 dias; edição nesta aba.",
      ),
      ...d.archive.map((x: any) =>
        button(x.title + " ↗", "open", { "data-id": x.id }),
      ),
    ]),
    h(
      "p.note",
      "Gramática: módulo: dependência, dependência. Identificadores minúsculos. Até 16 módulos e 48 ligações. O grafo é declarado, não importado.",
    ),
  ]);
}
function main(sources: any) {
  const updates = xs.create<any>({
    start(listener) {
      emit = () => listener.next(null);
    },
    stop() {
      emit = () => {};
    },
  });
  const actions = sources.DOM.select("button[data-action]")
    .events("click")
    .map((e: any) => () => {
      const target = e.ownerTarget as HTMLElement,
        action = target.dataset.action;
      const map: any = {
        compute: () => a.run(),
        retry: () => a.init(),
        save: () => a.save(),
        reload: () => a.open(d.current.id),
        export: () => a.download(),
        share: () => a.share(),
        fresh: () => a.fresh(),
        preset: () => a.preset(d.catalog.presets[+target.dataset.index!]),
        open: () => a.open(target.dataset.id!),
      };
      map[action!]?.();
    });
  const inputs = sources.DOM.select("input,textarea")
    .events("input")
    .map((e: any) => () => {
      const node = e.target as HTMLInputElement;
      if (node.id === "title") a.title(node.value);
      else a.change(node.id === "source" ? "graph" : "root", node.value);
    });
  const commands = xs.merge(actions, inputs);
  commands.addListener({
    next: (fn: any) => fn(),
    error: console.error,
    complete: () => {},
  });
  return { DOM: updates.startWith(null).map(view) };
}
const dispose = run(main, { DOM: makeDOMDriver("#app-root") });
motionToggle((v) => stage.pause(v));
window.addEventListener("pagehide", dispose, { once: true });
void a.init();
