export const inputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["graph", "root"],
  properties: {
    graph: { type: "string", minLength: 1, maxLength: 2400 },
    root: { type: "string", pattern: "^[a-z][a-z0-9-]{0,15}$" },
  },
};
