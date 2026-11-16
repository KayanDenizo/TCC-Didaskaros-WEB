import { useEffect } from "react";

/** mostra os `.reveal` com animacao qnd entram na tela */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.classList.add("is-visible");
            io.unobserve(el);
            // o atraso escalonado serve so pra entrada, dps ia deixar o hover lento
            const fim = (ev: TransitionEvent) => {
              if (ev.target !== el || ev.propertyName !== "opacity") return;
              el.style.transitionDelay = "";
              el.removeEventListener("transitionend", fim);
            };
            el.addEventListener("transitionend", fim);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
