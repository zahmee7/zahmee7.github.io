// Caption files for each film, built from the scenes in content/projects.json, so the captions and the
// text under the film never drift apart. Served at /films/<id>/captions.<lang>.vtt.
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { locales, type Locale } from "../../../i18n/utils";

export const getStaticPaths = (async () => {
  const projects = await getCollection("projects");
  return projects
    .filter((entry) => entry.data.mvp && entry.data.film.scenes?.length)
    .flatMap((entry) => locales.map((lang) => ({ params: { id: entry.data.id, lang }, props: { entry } })));
}) satisfies GetStaticPaths;

function timestamp(seconds: number): string {
  const whole = Math.floor(seconds);
  const hours = String(Math.floor(whole / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const secs = String(whole % 60).padStart(2, "0");
  const millis = String(Math.round((seconds - whole) * 1000)).padStart(3, "0");
  return `${hours}:${minutes}:${secs}.${millis}`;
}

export const GET: APIRoute<{ entry: CollectionEntry<"projects"> }> = ({ params, props }) => {
  const lang = params.lang as Locale;
  const { entry } = props;
  const cues = (entry.data.film.scenes ?? []).map(
    (scene, index) =>
      `${index + 1}\n${timestamp(scene.start)} --> ${timestamp(scene.end)}\n${scene[lang].split(" · ").join("\n")}`,
  );
  return new Response(`WEBVTT\n\n${cues.join("\n\n")}\n`, {
    headers: { "Content-Type": "text/vtt; charset=utf-8" },
  });
};
