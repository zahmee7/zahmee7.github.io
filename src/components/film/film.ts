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

    // A film that fails to load (a dropped connection on a phone) tries once more by itself, instead of
    // waiting for the page to be reloaded; the browser's own controls stay there to press again.
    let retried = false;
    let stopped = false;
    const retry = (): void => {
      // only for a real failure: not a pause, not a closed file
      const failed = full.error !== null || full.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
      if (retried || stopped || full.hidden || !failed) return;
      retried = true;
      full.load();
      full.play().catch(() => undefined);
    };
    full.addEventListener("error", retry);
    full.querySelector("source:last-of-type")?.addEventListener("error", retry);

    const start = (): void => {
      loop.pause();
      loop.hidden = true;
      play.hidden = true;
      full.hidden = false;
      full.focus();
      // no source chosen yet, or the last choice failed: choose again before playing
      if (full.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || full.error) full.load();
      full.play().catch(retry);
    };
    play.addEventListener("click", start);

    stops.push(() => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", update);
      stopped = true;
      play.removeEventListener("click", start);
      full.removeEventListener("error", retry);
      loop.pause();
      full.pause();
    });
  }

  return () => {
    for (const stop of stops) stop();
  };
}
