# kat-ko.github.io

Personal academic homepage of Kathrin Korte. Jekyll, built by GitHub Pages; no build pipeline of its own.

## Go live

1. On GitHub, create a **public** repository named exactly `kat-ko.github.io`.
2. Push this folder to its `main` branch.
3. Settings → Pages: source "Deploy from a branch", branch `main`, folder `/ (root)`. The site appears at https://kat-ko.github.io after a minute or two.

## Where things are edited

| What | File |
|---|---|
| Bio text | `index.md` (`<span class="spell">…</span>` = red squiggle highlight) |
| Name, tagline, photo, email, links | `_data/profile.yml` |
| Publications (front page) | `_data/publications.yml` |
| Academic service (front page) | `_data/service.yml` |
| Reading shelf + archive | `_data/bookshelf.yml` |
| Art gallery | `_data/art.yml`, files in `assets/art/` |
| Design (distortion, glitch) | `_data/design.json` |
| Blog posts | `_posts/YYYY-MM-DD-title.md` |
| Visitor counter | `goatcounter:` in `_config.yml` |

**Photo:** put a 4:5 portrait at `assets/img/kati.jpg` and set `photo: /assets/img/kati.jpg`.
**CV:** put the pdf at `assets/cv.pdf` and uncomment the CV entry in `bio_links`.
**ORCID:** fill in its url in `bio_links`; links with an empty url are hidden.
**Email:** shown only as an "email" link; the address is assembled by JavaScript from `email.user` and `email.domain`.

## Design tuning

Open any page with `?dev` appended (e.g. `https://kat-ko.github.io/?dev`). The control panel appears; settings are kept in your browser only. "copy config" → paste the JSON into `_data/design.json` → push. Visitors always see `design.json`; the panel never shows without `?dev`. Visitors with reduced-motion enabled get no background animation.

Visitors see the designed (glitch) version by default. The `[plain view]` button top left switches to a plain black-and-white version without distortion or animation; the choice is remembered in their browser (localStorage, no cookie) until they switch back.

## Visitor counter

Sign up at goatcounter.com (free for personal sites, no cookies, no consent banner needed), choose the code `kat-ko`, set `goatcounter: "kat-ko"` in `_config.yml`. Stats are private at kat-ko.goatcounter.com. Your own visits with `?dev` are not counted.

## Blog

The blog tab appears in the menu automatically once `_posts/` contains a post. `_drafts/example-post-with-math.md` shows the syntax: Markdown, LaTeX as `$$…$$` (inline inside a sentence, display on separate lines), rendered by self-hosted KaTeX. Feed: `/blog/feed.xml`.

## Art types

While `_data/art.yml` is empty (`[]`), the tab shows "coming soon". Types: `image`, `video`, `audio`, `embed` (YouTube, Vimeo, Bandcamp, SoundCloud; loads only on click), `link`. See the comments at the top of `_data/art.yml`. Keep files in the repo below ~50 MB; GitHub rejects files over 100 MB.

## Local preview (optional)

Needs Ruby: `bundle install`, then `bundle exec jekyll serve --drafts`, open http://localhost:4000.

## Privacy

No cookies, no fonts or scripts from third parties (Courier Prime and KaTeX are self-hosted). Only GoatCounter's counting script, once enabled, and embeds after a click load external content.
