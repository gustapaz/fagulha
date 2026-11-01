import ClientBoot from "./client-boot";
export default function Home() {
  return (
    <>
      <a className="skip" href="#app-root">
        Ir ao editor do circuito
      </a>
      <header>
        <a className="brand" href="/">
          FAGULHA<span>DEPENDÊNCIAS SOB TENSÃO</span>
        </a>
        <span>CONEXÃO / SEM EXECUÇÃO</span>
        <a href="/api-docs.html">Contrato ↗</a>
      </header>
      <main>
        <section className="wall">
          <div className="wall-title">
            <span>LABORATÓRIO DE IMPACTO</span>
            <h1>
              Mude um ponto.
              <br />
              <em>Sinta a rede.</em>
            </h1>
          </div>
          <canvas
            id="cables"
            role="img"
            aria-label="Grafo de dependências e impacto, com descrição textual no painel"
          />
          <div className="legend">
            <span>■ FOCO</span>
            <span>━ IMPACTO REVERSO</span>
            <span>■ CICLO</span>
          </div>
          <img
            src="/media/subject.webp"
            width="1200"
            height="800"
            loading="lazy"
            alt="Cabos reais, referência material para o circuito abstrato"
          />
        </section>
        <section id="app-root">Ligando os módulos…</section>
      </main>
      <footer>
        <span>Gustavo Paz / Fagulha</span>
        <a href="/credits.html">Créditos ↗</a>
        <a href="https://github.com/gustapaz/fagulha">Código ↗</a>
        <button id="motion-toggle" aria-pressed="false">
          Pausar movimento
        </button>
      </footer>
      <ClientBoot />
    </>
  );
}
