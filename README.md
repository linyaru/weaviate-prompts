# weaviate-prompts

Single source of truth for Weaviate prompt templates. Used throughout Weaviate to power copy-paste coding experiences, quick-start plugins, and documentation pages.

## Directory structure

```
prompts/
  {feature}/
    {use-case}/
      {environment}/
        prompt.{language}.md
```

- **feature** — Weaviate feature area or page context (e.g. `quickstart`, `hybrid-search`, `rag`)
- **use-case** — Specific task the prompt builds (e.g. `build-movie-search-app`)
- **environment** — `cloud` or `local`
- **language** — `python`, `typescript`, `go`, `java`, `csharp`, etc.

Paths are deterministic. A consumer that knows the four dimensions can construct the raw URL directly:

```
https://raw.githubusercontent.com/weaviate/weaviate-prompts/main/prompts/{feature}/{use-case}/{environment}/prompt.{language}.md
```

## Prompt file format

Each prompt file uses YAML frontmatter followed by the prompt body in markdown:

```markdown
---
id: build-movie-search-app
title: Build a Weaviate Web App with FastAPI
feature: quickstart
environment: cloud
language: python
framework: FastAPI + Uvicorn
estimated_time_minutes: 10
---

# Build a Weaviate Web App with FastAPI

Prompt content here...
```

### Frontmatter fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier for the use-case (shared across languages) |
| `title` | Yes | Human-readable title |
| `feature` | Yes | Feature area (must match directory) |
| `environment` | Yes | `cloud` or `local` (must match directory) |
| `language` | Yes | Programming language (must match filename) |
| `framework` | Yes | Framework used (e.g. `FastAPI + Uvicorn`, `Next.js (App Router) + Tailwind CSS`) |
| `estimated_time_minutes` | No | Estimated time for the user to complete |

## Setup

Requires [pre-commit](https://pre-commit.com/) and Node.js.

```bash
pip install pre-commit   # if not already installed
make install             # installs git hooks
```

On every commit, pre-commit will automatically:
- Validate frontmatter (required fields, path consistency)
- Regenerate `index.json` if any prompt files changed
- Fix trailing whitespace and missing final newlines
- Validate `index.json` is well-formed JSON
- Check for merge conflict markers

## Commands

| Command | Description |
|---|---|
| `make install` | Install pre-commit hooks |
| `make check` | Run all pre-commit checks against all files |
| `make index` | Regenerate `index.json` from prompt frontmatter |
| `make validate` | Validate all prompt files (frontmatter, path consistency) |
| `make clean` | Auto-fix whitespace and newline issues |
| `make list` | List all prompt files |
| `make help` | Show available commands |

## index.json

The root `index.json` provides a grouped listing of all prompts with metadata:

```json
{
  "version": "1.0.0",
  "prompts": {
    "quickstart": {
      "id": "build-movie-search-app",
      "description": "...",
      "features": ["..."],
      "languages": {
        "python": { "path": "prompts/quickstart/...", "title": "...", "framework": "..." }
      }
    }
  }
}
```

Top-level fields (`description`, `detailedDescription`, `features`) are hand-authored. Per-language fields (`path`, `title`, `framework`) are generated from frontmatter. Run `make index` to regenerate; the script preserves hand-authored fields.

## Adding a new prompt

1. Create the file at `prompts/{feature}/{use-case}/{environment}/prompt.{language}.md`
2. Add frontmatter with all required fields
3. Write the prompt body
4. If this is a new feature, add `description`, `detailedDescription`, and `features` to the feature entry in `index.json`
5. Run `make check` to validate and update the index
6. Commit — the pre-commit hook will catch any issues

## Current prompts

| Feature | Use Case | Languages | Environment |
|---|---|---|---|
| quickstart | build-movie-search-app | Python, TypeScript, Go, Java, C# | cloud |
