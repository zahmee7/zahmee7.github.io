// Runs the film frames inside a root (Film.astro, MOTION.md sequence 7). Used by the open file (file.ts)
// and the project page. Returns a stop function that pauses everything and lets go of the observers.
// - The silent loop plays only while at least half the frame is in view and motion is allowed.
//   It has preload="none", so nothing is fetched until it first plays.
// - Play hides the loop and plays the full film in the same frame, with the browser's own controls.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export function setUpFilms(root: ParentNode): () => void {
  const stops: Array<() => void> = [];

  for (const frame of root.querySelectorAll<HTMLElement>("[data-film]")) {
    const loop = frame.querySelector<HTMLVideoElement>(".film__loop");
    const full = frame.querySelector<HTMLVideoElement>(".film__full");
    const play = frame.querySelector<HTMLButtonElement>("[data-play]");
    if (!loop || !full || !play) continue;

    let inView = false;
    const update = (): void => {
      if (inView && !reducedMotion.matches && full.hidden) loop.play().catch(() => undefined);
      else loop.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5);
        update();
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(frame);
    reducedMotion.addEventListener("change", update);

    const start = (): void => {
      loop.pause();
      loop.hidden = true;
      play.hidden = true;
      full.hidden = false;
      full.focus();
      full.play().catch(() => undefined);
    };
    play.addEventListener("click", start);

    stops.push(() => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", update);
      play.removeEventListener("click", start);
      loop.pause();
      full.pause();
    });
  }

  return () => {
    for (const stop of stops) stop();
  };
}
