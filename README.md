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

You can get `huoxu/all-MiniLM-L6-v2-Q8_0` (8 bit quantized, better performance less accuracy, mostly unnoticable): [Download link](https://huggingface.co/huoxu/all-MiniLM-L6-v2-Q8_0-GGUF/resolve/main/all-minilm-l6-v2-q8_0.gguf?download=true)
*Note: Ensure you rename to `minilm-16.gguf` and store it in `src-tauri/res/{name}`* I would make this so much easier later on. For now you can use just this embedding model to avoid mismatched dimensions or still you can edit the code and update your embedding's dimensions


## Scripts

| Command               | What              |
| --------------------- | ----------------- |
| `dev`                 | Vite dev server   |
| `build`               | Production build  |
| `preview`             | Preview the build |
| `format`/`lint`/`check` | Biome           |

