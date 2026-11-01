# Validação — FAGULHA

Conferência em 2026-11-01. Demo: [FAGULHA](https://fagulha-gustapaz.starrylinen.chatgpt.site).

- 23 testes de domínio, API e D1 aprovados; o lote completo soma 215 testes.
- Build de produção, TypeScript e formatação aprovados. CI reproduz os testes no GitHub.
- Smoke HTTP público aprovado: saúde do banco, domínio, rejeição de entrada extra, criação, leitura privada, isolamento, edição, revisão antiga/CAS, publicação, exportação, encerramento do link, remoção do registro de teste, HTML e OpenAPI.
- Navegador público: calcular, guardar, reler, criar link e baixar o arquivo da revisão salva.
- Desktop e larguras de 390 e 768 px verificadas. Com barra de rolagem, as áreas úteis observadas foram 375 e 753 px; nenhuma rolagem horizontal após as correções.
- Módulo inexistente rejeitado; recuperação pelo grafo com ciclo; DOT exportado contém o ciclo declarado.
- Exportação verificada: `fagulha.dot`, 160 bytes, SHA-256 `39972e9b7f247801fc608b78e8bdbde6907221bc6e0448d6f03e809e2207e4a6`.

## Evidências visuais

![Demo no desktop](screenshots/desktop.jpg)

![Demo no celular](screenshots/mobile.jpg)

## Publicação e limites

Commit da aplicação publicada: `12667a5b9e678dc1993ad3afe4365d5401afb4a9`. Commits posteriores que acrescentam estas evidências não alteram o bundle da aplicação.

Dados de demonstração sintéticos, retenção de sete dias, limite global de doze novos registros por hora UTC e até trinta revisões por registro. Edição autorizada por chave aleatória guardada nesta aba; um link público permite leitura. A demo não promete disponibilidade ilimitada nem armazenamento permanente. Nenhum cartão, trial ou faturamento foi ativado.

Não há nota Lighthouse declarada nem certificação de conformidade: as verificações acima descrevem os testes efetivamente executados.
