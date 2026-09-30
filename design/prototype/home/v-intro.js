// Variant C · a short introduction beside the headline: a monogram, two lines about the owner and his three
// areas, drawn from the project brief (CLAUDE.md, first lines). Nothing from inside the projects.
// In the prototype the words live here; if chosen, they move to content/site.json.
(() => {
  const grid = document.querySelector(".hero__grid");
  if (!grid) return;
  const ar = document.documentElement.lang === "ar";
  const text = ar
    ? {
        monogram: "م",
        line: "أخصائي في إدارة وحوكمة البيانات في المملكة، أطبّق معايير مكتب إدارة البيانات الوطنية والمؤشر الوطني للبيانات على أرض الواقع.",
        areas: ["حوكمة البيانات", "معايير مكتب إدارة البيانات الوطنية", "المؤشر الوطني للبيانات"],
      }
    : {
        monogram: "M",
        line: "A data management and governance specialist in Saudi Arabia. I apply the NDMO standards and the National Data Index in practice.",
        areas: ["Data governance", "NDMO standards", "National Data Index"],
      };

  const intro = document.createElement("aside");
  intro.className = "intro";
  const mark = document.createElement("span");
  mark.className = "intro__mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = text.monogram;
  const line = document.createElement("p");
  line.className = "intro__line";
  line.textContent = text.line;
  const areas = document.createElement("ul");
  areas.className = "intro__areas";
  for (const area of text.areas) {
    const item = document.createElement("li");
    item.textContent = area;
    areas.append(item);
  }
  intro.append(mark, line, areas);
  grid.append(intro);
})();
