---
id: batch-import-tabular-files
title: Import Multiple CSV/Excel Files
feature: collections-tool
environment: cloud
language: python
estimated_time_minutes: 5
---

Write a Python script using the Weaviate v4 client to batch-import CSV and Excel (.xlsx) files into a Weaviate Cloud collection, using text2vec-weaviate embeddings.

## Prerequisites
1. Get your **WEAVIATE_URL** (REST Endpoint) and **WEAVIATE_API_KEY** (Admin API Key)
2. Choose an appropriate collection name **COLLECTION_NAME**

## Installation

Required packages:
- `weaviate-client>=4.19.0` - Weaviate Python client for database operations
- `openpyxl` - Read Excel (.xlsx) files
- `python-dotenv` - Load environment variables from .env file

Standard library modules used: `csv`, `argparse`, `pathlib`, `re`

## Project Structure

Create:
- `csv_import.py` - Batch import script
- `.env` - Environment variables with WEAVIATE_URL, WEAVIATE_API_KEY
- `requirements.txt` - List package dependencies

## Implementation Details

### Connection
- Connect to Weaviate Cloud using environment variables: **WEAVIATE_URL** and **WEAVIATE_API_KEY**
- Configure request timeouts suitable for large batches
- Always close the client at the end

### File parsing:
- Detect format by file extension and dispatch to the appropriate reader:
  - `.csv` → Python's `csv.DictReader`; open files with `newline=''` to correctly handle multi-line quoted fields
  - `.xlsx` → `openpyxl.load_workbook(path, read_only=True)`; read the first sheet, extract headers from row 1, convert all cell values to strings for uniform downstream handling
- Both readers must return the same structure: `(headers: list[str], rows: list[dict[str, str]])`
- Read all files into memory and validate that every file shares the same header row; exit with a clear error on mismatch

### Auto-detect column types:
Examine values across all rows for each column and apply this precedence:
1. If every non-empty value matches `^-?\d+$` → `DataType.INT`
2. Else if every non-empty value parses as `float()` → `DataType.NUMBER`
3. Else if every non-empty value is `true`/`false` (case-insensitive) → `DataType.BOOL`
4. Otherwise → `DataType.TEXT`

### Property name sanitisation:
Headers may contain spaces or special characters. Replace any character that is not `[a-zA-Z0-9_]` with `_`, strip leading/trailing underscores, and ensure the first character is lowercase.

### Collection configuration:
- Name: **COLLECTION_NAME**
- Vectorizer: text2vec-weaviate (use `vectorizer_config=Configure.Vectorizer.text2vec_weaviate()` syntax)
- Model: Snowflake/snowflake-arctic-embed-l-v2.0
- Properties: generated dynamically from the detected schema — one `Property(name, data_type, description)` per column

### CLI requirements (argparse):
- --path: one or more inputs; each can be a CSV/Excel file path or a directory
- --recursive: default true; when a directory is given, search recursively
- --glob: optional; override the default search pattern (default: "**/*.csv" + "**/*.xlsx" when recursive, else "*.csv" + "*.xlsx")
- --collection-name: **COLLECTION_NAME**
- --delete-and-recreate: optional flag; if set, delete the collection if it exists and recreate it
- --dry-run: optional flag; discover files, count rows, and print the detected schema without writing to Weaviate

### Import requirements:
- Validate all input paths exist
- If no supported files found, exit with helpful guidance
- Make sure the import script is readable
- Coerce each cell to its detected Python type (int/float/bool/str) before inserting; treat empty cells as `None` and skip them
- Use server-side batching if available (v1.34+), otherwise use client-side batching with batch size of 100 and 2 concurrent requests
- Check batch.number_errors every 100 objects and log any failed objects
- Log and report progress: file name, rows processed, total objects, and any errors
- Skip rows that fail coercion rather than aborting the entire import

### Output
- After installing dependencies, inspect the `weaviate-client` package (see docs at https://docs.weaviate.io/weaviate/client-libraries/python) for the correct collection creation API before writing code
- Provide the full Python file, with helpful comments where applicable
- The file should be ready to run as: `python csv_import.py --path ./data`
- The package dependencies should be ready to install as: `pip install -r requirements.txt`
- Keep secrets in env vars; do not print API keys
