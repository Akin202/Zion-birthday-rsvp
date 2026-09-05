# public/

Static assets served as-is at the site root (Vite convention).

## Needed before deploy

- **og-preview.jpg** — 1200×630px, under 250KB. Used by `index.html`'s
  `og:image` tag for WhatsApp/Facebook link previews. WhatsApp silently
  drops oversized images, so stay under the limit.
- **images/celebrant.jpg** — referenced by `celebrant.photoUrl` in
  `config/event.config.ts`. Not currently present anywhere in the repo.

Both are currently missing — no image assets exist in this project.
