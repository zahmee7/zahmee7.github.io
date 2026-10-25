// Makes the web files for each film from its masters, with the export specs in films/SCRIPTS.md:
//   films/<id>/master-en.(mp4|mov), master-ar.(mp4|mov) → film-<lang>.mp4 (H.264) and film-av1-<lang>.mp4 (AV1)
//   A film made in one language has one master: both pages show it, with captions in the other language
//   (Film.astro, owner's decision 2026-10-25).
//   films/<id>/loop-master.(mp4|mov), or else a master cut at the loop scene → loop.mp4, loop-av1.mp4
//   the first frame of the loop → poster.avif
// Output goes to src/assets/films/<id>/, where Film.astro finds it. Each file is then checked against its
// size budget; a film's budget grows with its length. Usage: npm run films, or npm run films -- <id>.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";

const LOOP_SECONDS = 6;
const MB = 1024 * 1024;
// Per minute of film for the films themselves (a film under a minute still gets a minute's budget)
const BUDGET = {
  "film-en.mp4": 12 * MB,
  "film-ar.mp4": 12 * MB,
  "film-av1-en.mp4": 8 * MB,
  "film-av1-ar.mp4": 8 * MB,
  "loop.mp4": 1.5 * MB,
  "loop-av1.mp4": 1 * MB,
  "poster.avif": 0.25 * MB,
};
const PER_MINUTE = new Set(["film-en.mp4", "film-ar.mp4", "film-av1-en.mp4", "film-av1-ar.mp4"]);

// The commands of films/SCRIPTS.md > export specs
const FILM_H264 =
  "-c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k";
const FILM_AV1 = "-c:v libsvtav1 -preset 6 -crf 34 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k";
const LOOP = `-t ${LOOP_SECONDS} -vf scale=1280:-2 -an -pix_fmt yuv420p -movflags +faststart`;
const LOOP_H264 = "-c:v libx264 -crf 26";
const LOOP_AV1 = "-c:v libsvtav1 -crf 38";
const POSTER = "-frames:v 1 -c:v libaom-av1 -still-picture 1 -crf 30";
const words = (line) => line.split(" ");

if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
  console.error("ffmpeg is not installed or not on PATH.");
  process.exit(1);
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    encoding: "utf8",
  });
  if (run.status !== 0) {
    console.error(run.stderr);
    process.exit(1);
  }
}

const master = (dir, name) =>
  ["mp4", "mov"].map((ext) => `${dir}/${name}.${ext}`).find((path) => existsSync(path));

const projects = JSON.parse(await readFile("content/projects.json", "utf8"));
const only = process.argv.slice(2);
let over = 0;
let made = 0;

for (const project of projects) {
  if (only.length > 0 && !only.includes(project.id)) continue;
  const source = `films/${project.id}`;
  const masters = Object.fromEntries(
    Object.entries({ en: master(source, "master-en"), ar: master(source, "master-ar") }).filter(
      ([, path]) => path,
    ),
  );
  if (Object.keys(masters).length === 0) continue;

  const out = `src/assets/films/${project.id}`;
  mkdirSync(out, { recursive: true });
  console.log(`\n${project.id}`);

  for (const [lang, input] of Object.entries(masters)) {
    ffmpeg(["-i", input, ...words(FILM_H264), `${out}/film-${lang}.mp4`]);
    ffmpeg(["-i", input, ...words(FILM_AV1), `${out}/film-av1-${lang}.mp4`]);
  }

  // The loop: a text-free clip exported on its own, or a master (English first) at the start of the loop scene
  const loopMaster = master(source, "loop-master");
  const scene = project.film.scenes?.[(project.film.loopScene ?? 3) - 1];
  const cut = loopMaster
    ? ["-i", loopMaster]
    : ["-ss", String(scene?.start ?? 0), "-i", masters.en ?? masters.ar];
  ffmpeg([...cut, ...words(LOOP), ...words(LOOP_H264), `${out}/loop.mp4`]);
  ffmpeg([...cut, ...words(LOOP), ...words(LOOP_AV1), `${out}/loop-av1.mp4`]);
  ffmpeg(["-i", `${out}/loop.mp4`, ...words(POSTER), `${out}/poster.avif`]);

  const minutes = Math.max(1, project.film.lengthSec / 60);
  for (const [name, perFile] of Object.entries(BUDGET)) {
    if (!existsSync(`${out}/${name}`)) continue;
    const limit = PER_MINUTE.has(name) ? perFile * minutes : perFile;
    const size = statSync(`${out}/${name}`).size;
    const ok = size <= limit;
    if (!ok) over += 1;
    console.log(
      `  ${ok ? "ok  " : "OVER"} ${name.padEnd(16)} ${(size / MB).toFixed(2)} MB (limit ${(limit / MB).toFixed(2)})`,
    );
  }
  made += 1;
}

if (made === 0) {
  console.log("No masters found. Put master-en and/or master-ar (mp4 or mov) in films/<project-id>/.");
} else if (over > 0) {
  console.error(`\n${over} file(s) over budget. Raise -crf for that file, or shorten the master.`);
  process.exit(1);
}
