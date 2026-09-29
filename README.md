# Datasoc

> An intelligent knowledge retention engine — search your past knowledge by keywords, semantic, and intent.

![Datasoc home — saved records, drafts, completed, starred](./.github/media/datasoc-home.png)

## Features

- **Records, not files:** rich-text notes with tags, flags, favorites, trash — everything queryable
- **Hybrid search:** keyword (FTS5) + semantic vectors (MiniLM), fused with RRF ranking
- **100% local:** SQLite + on-device embeddings. No account, no cloud, no telemetry
- **Command palette:** global search and navigation from the keyboard
- **Built-in query inspector:** watch every query and mutation live
- **Offline-first:** no network, no problem

## Run it

No binaries yet — run from source:

```bash
bun install
bunx tauri dev         # desktop app (needs Rust toolchain)

# Does not support web, maybe in future with an external db, sqlite-vec on web isn't really what I am looking for
```

**Requirements:** Bun · Rust toolchain (Tauri only) · `src-tauri/res/minilm-l6.gguf`


## Scripts

| Command               | What              |
| --------------------- | ----------------- |
| `dev`                 | Vite dev server   |
| `build`               | Production build  |
| `preview`             | Preview the build |
| `format`/`lint`/`check` | Biome           |

