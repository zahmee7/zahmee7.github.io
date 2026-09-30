# Third-party skills

| Skill | Source | Version | License | Installed as |
|---|---|---|---|---|
| `frontend-design` | https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design | plugin 1.1.0 (repo `684800b`, 2026-09-29) | Anthropic, see source repo | Plugin, declared in `.claude/settings.json` (marketplace `claude-code-plugins`). Not copied into this repo. |
| `web-design` | https://github.com/KAOPU-XiaoPu/web-design | commit `22a4f48` (2026-06-25) | MIT, `web-design/LICENSE` | Copied to `.claude/skills/web-design/` (without its `docs/` demo site) |
| `mega-frontend-design` | https://github.com/FerasMahmoud/mega-frontend-design | commit `78547f2` (2026-03-16) | MIT, stated in its `README.md` | Copied to `.claude/skills/mega-frontend-design/` |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, `gsap-utils`, `gsap-frameworks` | https://github.com/greensock/gsap-skills (official, GreenSock) | commit `aed9cfd` (2026-04-21) | MIT, `LICENSE` in each folder | Copied to `.claude/skills/gsap-*/`. `gsap-react` left out: the main site does not use React. |

Project skills written for this repo: `confidentiality-check`, `ship-check`.

## Updating

```
git clone --depth 1 https://github.com/KAOPU-XiaoPu/web-design
git clone --depth 1 https://github.com/FerasMahmoud/mega-frontend-design
git clone --depth 1 https://github.com/greensock/gsap-skills
```

Copy the skill folders over the old ones, then check `/skills` in Claude Code. The plugin updates with:

```
claude plugin update frontend-design@claude-code-plugins
```
