import { routeTable, simpleDispatch } from "./routes.mjs";
import { service } from "./service.mjs";
import { guarded, errorResponse, readJson } from "./transport.mjs";
import { fail } from "./errors.mjs";
import { buildSchema, parse, visit } from "graphql";
import { processRequest, getGraphQLParameters } from "graphql-helix";
const schema = buildSchema(
  `type Node {id:String!, dependencies:[String!]!, dependents:[String!]!, cyclic:Boolean!, layer:Int!, row:Int!} type Edge {from:String!,to:String!} type Analysis {nodes:[Node!]!,edges:[Edge!]!,cycles:[[String!]!]!,acyclic:Boolean!,order:[String!]!,blocked:[String!]!,reachable:[String!]!,affected:[String!]!,root:String!} type Query {analyze(graph:String!,root:String!):Analysis!}`,
);
export function createApi(db, clock) {
  const dispatch = simpleDispatch(routeTable(db, service, clock));
  return guarded(async (req) => {
    if (new URL(req.url).pathname !== "/api/graphql") return dispatch(req);
    if (req.method !== "POST") fail("method_not_allowed", "Use POST.", 405);
    const body = await readJson(req),
      request = {
        body,
        headers: Object.fromEntries(req.headers),
        method: req.method,
        query: {},
      };
    if (typeof body.query !== "string" || body.query.length > 3000)
      fail("invalid_query", "Consulta de até 3000 caracteres.", 400);
    let ast;
    try {
      ast = parse(body.query);
    } catch {
      fail("invalid_query", "Consulta GraphQL inválida.", 400);
    }
    let fields = 0,
      depth = 0,
      maxDepth = 0,
      roots = 0;
    visit(ast, {
      Field: {
        enter() {
          fields++;
          depth++;
          maxDepth = Math.max(maxDepth, depth);
          if (depth === 1) roots++;
        },
        leave() {
          depth--;
        },
      },
    });
    if (fields > 32 || maxDepth > 6 || roots !== 1)
      fail(
        "query_limit",
        "Uma análise por consulta, até 32 campos e profundidade 6.",
        400,
      );
    const parameters = getGraphQLParameters(request),
      result = await processRequest({
        ...parameters,
        request,
        schema,
        rootValueFactory: () => ({
          analyze: (input) => service.compute(input),
        }),
      });
    if (result.type !== "RESPONSE")
      fail(
        "unsupported_operation",
        "Streaming e subscriptions não estão disponíveis.",
        400,
      );
    const payload = result.payload;
    if (payload?.errors)
      payload.errors = payload.errors.map((e) => ({
        message: e.originalError?.code
          ? e.message
          : "Consulta ou parâmetros inválidos.",
        locations: e.locations,
        path: e.path,
      }));
    return Response.json(payload, {
      status: result.status,
      headers: Object.fromEntries(result.headers.map((h) => [h.name, h.value])),
    });
  });
}
