import { useEffect } from "react";

/**
 * efeitos interativos da landing. tudo funciona com variavel css (o visual ta no
 * index.css), aqui so mede rolagem e mouse.
 *
 * - `--rolagem` (0..1) na .landing: progresso da pagina, usado na barra do topo
 * - `--hero` (0..1) na .landing: o quanto o hero ja saiu da tela
 * - `[data-rolagem]` ganha `--p` (0..1) conforme passa pela tela
 * - `[data-fixo]` ganha `--f` (0..1) conforme rola a secao fixa
 * - `--hx/--hy` (-1..1) no hero: posicao do mouse, pro parallax do fundo
 * - `.cartao`: luz seguindo o mouse (`--cx/--cy`) e inclinacao 3D (`rotate`)
 * - `[data-luz]`: brilho q segue o mouse na secao (`--lx/--ly`)
 */
export function useEfeitosLanding() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>(".landing");
    if (!raiz) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const limpar: (() => void)[] = [];
    function ouvir<E extends Event>(
      alvo: EventTarget,
      tipo: string,
      fn: (e: E) => void,
      opcoes?: AddEventListenerOptions,
    ) {
      alvo.addEventListener(tipo, fn as EventListener, opcoes);
      limpar.push(() => alvo.removeEventListener(tipo, fn as EventListener));
    }

    // elementos q animam com a rolagem. o valor medido serve so de alvo, o valor aplicado
    // vai correndo atras dele a cada frame, assim a rodinha do mouse (q pula de 100 em 100px)
    // vira um movimento continuo
    const rolaveis = [...document.querySelectorAll<HTMLElement>("[data-rolagem]")];
    const fixos = [...document.querySelectorAll<HTMLElement>("[data-fixo]")];
    const alvo = new Map<HTMLElement, number>();
    const atual = new Map<HTMLElement, number>();
    const limitar = (v: number) => Math.min(Math.max(v, 0), 1);

    let quadroSuave = 0;
    const suavizar = () => {
      quadroSuave = 0;
      let mexendo = false;
      for (const [el, t] of alvo) {
        let c = atual.get(el) ?? t;
        c += (t - c) * 0.14;
        if (Math.abs(t - c) < 0.0005) c = t;
        else mexendo = true;
        atual.set(el, c);
        el.style.setProperty(el.hasAttribute("data-fixo") ? "--f" : "--p", c.toFixed(4));
      }
      if (mexendo) quadroSuave = requestAnimationFrame(suavizar);
    };
    limpar.push(() => cancelAnimationFrame(quadroSuave));

    // rolagem: no maximo uma medicao por frame
    let quadro = 0;
    const medirRolagem = () => {
      quadro = 0;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      raiz.style.setProperty("--rolagem", (max > 0 ? window.scrollY / max : 0).toFixed(4));
      if (!reduzido) raiz.style.setProperty("--hero", Math.min(window.scrollY / 700, 1).toFixed(4));

      // --p: 0 qnd o elemento aparece embaixo, 0.5 no meio da tela, 1 qnd some em cima
      for (const el of rolaveis) {
        const r = el.getBoundingClientRect();
        alvo.set(el, reduzido ? 0.5 : limitar((vh - r.top) / (vh + r.height)));
      }
      // --f: progresso dentro de uma secao com conteudo fixo (sticky)
      for (const el of fixos) {
        const r = el.getBoundingClientRect();
        alvo.set(el, reduzido ? 1 : limitar(-r.top / Math.max(r.height - vh, 1)));
      }
      if (!quadroSuave) quadroSuave = requestAnimationFrame(suavizar);
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medirRolagem);
    };
    ouvir(window, "scroll", agendar, { passive: true });
    ouvir(window, "resize", agendar);
    medirRolagem();
    limpar.push(() => cancelAnimationFrame(quadro));

    if (!reduzido && mouse) {
      for (const el of document.querySelectorAll<HTMLElement>(".cartao")) {
        ouvir<PointerEvent>(el, "pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          el.style.setProperty("--cx", `${x}px`);
          el.style.setProperty("--cy", `${y}px`);
          // gira num eixo perpendicular ao mouse, ai o canto apontado afunda
          const dx = x / r.width - 0.5;
          const dy = y / r.height - 0.5;
          // bloco grande gira menos, o mesmo angulo num bloco largo fica exagerado
          const angulo = Math.hypot(dx, dy) * 12 * Math.min(1, 320 / r.width);
          if (angulo > 0.05) el.style.rotate = `${(-dy).toFixed(3)} ${dx.toFixed(3)} 0 ${angulo.toFixed(2)}deg`;
        });
        ouvir(el, "pointerleave", () => {
          el.style.rotate = "";
        });
      }

      for (const el of document.querySelectorAll<HTMLElement>("[data-luz]")) {
        ouvir<PointerEvent>(el, "pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--lx", `${e.clientX - r.left}px`);
          el.style.setProperty("--ly", `${e.clientY - r.top}px`);
          el.classList.add("com-luz");
        });
        ouvir(el, "pointerleave", () => el.classList.remove("com-luz"));
      }

      const hero = document.getElementById("top");
      if (hero) {
        ouvir<PointerEvent>(hero, "pointermove", (e) => {
          const r = hero.getBoundingClientRect();
          hero.style.setProperty("--hx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          hero.style.setProperty("--hy", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
        ouvir(hero, "pointerleave", () => {
          hero.style.setProperty("--hx", "0");
          hero.style.setProperty("--hy", "0");
        });
      }
    }

    return () => limpar.forEach((f) => f());
  }, []);
}
