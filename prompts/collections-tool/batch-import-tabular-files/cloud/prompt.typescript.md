---
id: batch-import-tabular-files
title: Import Multiple CSV/Excel Files
feature: collections-tool
environment: cloud
language: typescript
estimated_time_minutes: 5
---

Write a TypeScript script using the Weaviate v3 client to batch-import CSV and Excel (.xlsx) files into a Weaviate Cloud collection, using text2vec-weaviate embeddings.

## Prerequisites
1. Get your **WEAVIATE_URL** (REST Endpoint) and **WEAVIATE_API_KEY** (Admin API Key)
2. Choose an appropriate collection name **COLLECTION_NAME**

## Installation

Required packages:
- `weaviate-client` (>=3.11.0) - Weaviate TypeScript client for database operations
- `csv-parse` - CSV parser with full RFC 4180 support (handles multi-line quoted fields)
- `xlsx` - SheetJS for reading Excel files (.xlsx, .xls)
- `commander` - CLI argument parsing
- `dotenv` - Load environment variables from .env file
- `glob` - File pattern matching for file discovery
- `tsx` (dev) - TypeScript execution without compilation

## Project Structure

Create:
- `csv_import.ts` - Batch import script
- `.env` - Environment variables with WEAVIATE_URL, WEAVIATE_API_KEY, COLLECTION_NAME
- `package.json` - Package manifest with dependencies

## Implementation Details

### Connection
- Connect to Weaviate Cloud using environment variables: **WEAVIATE_URL** and **WEAVIATE_API_KEY**
- Use `weaviate.connectToWeaviateCloud(url, { authCredentials: new weaviate.ApiKey(key) })`
- Always close the client at the end with `client.close()`

### File parsing:
- Detect format by file extension and dispatch to the appropriate reader:
  - `.csv` → `csv-parse/sync` with `{ columns: true, skip_empty_lines: true }`
  - `.xlsx` → `XLSX.readFile(path)` then `XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" })` on the first sheet; convert all cell values to strings for uniform downstream handling (use `import XLSX from "xlsx"` — default import, not namespace)
- Both readers must return the same structure: `{ headers: string[], rows: Record<string, string>[] }`
- Read all files into memory and validate that every file shares the same header row; exit with a clear error on mismatch

### Auto-detect column types:
Examine values across all rows for each column and apply this precedence:
1. If every non-empty value matches `/^-?\d+$/` → `dataType.INT`
2. Else if every non-empty value is finite via `Number()` → `dataType.NUMBER`
3. Else if every non-empty value is `"true"` or `"false"` (case-insensitive) → `dataType.BOOL`
4. Otherwise → `dataType.TEXT`

### Property name sanitisation:
Headers may contain spaces or special characters. Replace any character that is not `[a-zA-Z0-9_]` with `_`, strip leading/trailing underscores, and ensure the first character is lowercase.

### Collection configuration:
- Name: **COLLECTION_NAME**
- Vectorizer: text2vec-weaviate (use `configure.vectorizer.text2VecWeaviate()` syntax)
- Model: Snowflake/snowflake-arctic-embed-l-v2.0
- Properties: generated dynamically from the detected schema — one `{ name, dataType, description }` per column

### CLI requirements (commander):
- --path \<paths...\>: one or more inputs; each can be a CSV/Excel file path or a directory
- --no-recursive: default recursive is true; when a directory is given, search recursively; use --no-recursive to disable
- --glob \<pattern\>: optional; override the default search pattern (default: "**/*.csv" + "**/*.xlsx" when recursive, else "*.csv" + "*.xlsx")
- --collection-name \<name\>: **COLLECTION_NAME** from env or "Documents"
- --delete-and-recreate: optional flag; if set, delete the collection if it exists and recreate it
- --dry-run: optional flag; discover files, count rows, and print the detected schema without writing to Weaviate

### Import requirements:
- Validate all input paths exist
- If no supported files found, exit with helpful guidance
- Make sure the import script is readable
- Coerce each cell to its detected type (number/boolean/string) before inserting; treat empty cells as undefined and omit them
- Batch objects using `collection.data.insertMany()` with a batch size of 100
- Check `response.hasErrors` and iterate `response.errors` after each batch, logging any failed objects
- Log and report progress: file name, rows processed, total objects, and any errors
- Skip rows that fail coercion rather than aborting the entire import

### Output
- After installing dependencies, inspect the `weaviate-client` package (see docs at https://docs.weaviate.io/weaviate/client-libraries/typescript) for the correct collection creation API before writing code
- Provide the full TypeScript file, with helpful comments where applicable
- The file should be ready to run as: `npx tsx csv_import.ts --path ./data`
- The package dependencies should be ready to install as: `npm install`
- Keep secrets in env vars; do not print API keys
