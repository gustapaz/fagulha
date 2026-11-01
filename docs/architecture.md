# Arquitetura

Modo integrado, conforme solution-contract.md. Cycle.js + xstream consome GraphQL Helix + Ajv standalone na mesma origem. SSR contém conteúdo, metadados e navegação; o bundle próprio monta depois da hidratação.

Gramática declarativa sem execução de código. Tarjan para componentes fortemente conexas, Kahn para ordem topológica, BFS para dependências e impacto reverso.

POST /api/graphql: query analyze(graph:String!, root:String!). Uma análise por consulta, até 32 campos e profundidade seis; não há streaming ou subscriptions.

service.mjs: domínio e exportação. input-schema.mjs: restrições canônicas. validator.mjs: validação da stack. api.mjs: protocolo/router. store.mjs: D1, tokens, CAS, TTL e cotas. transport.mjs: bytes/UTF-8, origem, erros mascarados e cabeçalhos.

AJV gera validadores ESM standalone em pretest/prebuild. Nenhum eval/new Function é necessário para validar entradas no Worker. Os arquivos gerados são ignorados e recriados a partir do schema versionado.
