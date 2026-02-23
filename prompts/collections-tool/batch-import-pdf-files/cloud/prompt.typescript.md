---
id: batch-import-pdf-files
title: Import Multiple PDF Files
feature: collections-tool
environment: cloud
language: typescript
estimated_time_minutes: 5
---

Write a TypeScript script using the Weaviate v3 client to batch-import PDF files into a Weaviate Cloud collection, using ColPali-style multi-vector embeddings.

## Prerequisites
1. Get your **WEAVIATE_URL** (REST Endpoint) and **WEAVIATE_API_KEY** (Admin API Key)
2. Choose an appropriate collection name **COLLECTION_NAME**

## Installation

Required packages:
- `weaviate-client` (>=3.11.0) - Weaviate TypeScript client for database operations
- `mupdf` - MuPDF WASM-based PDF rendering (zero system dependencies)
- `commander` - CLI argument parsing
- `dotenv` - Load environment variables from .env file
- `glob` - File pattern matching for PDF discovery
- `tsx` (dev) - TypeScript execution without compilation

## Project Structure

Create:
- `import.ts` - Batch import script
- `.env` - Environment variables with WEAVIATE_URL, WEAVIATE_API_KEY, COLLECTION_NAME
- `package.json` - Package manifest with dependencies

## Implementation Details

### Connection
- Connect to Weaviate Cloud using environment variables: **WEAVIATE_URL** and **WEAVIATE_API_KEY**
- Use `weaviate.connectToWeaviateCloud(url, { authCredentials: new weaviate.ApiKey(key) })`
- Always close the client at the end with `client.close()`

### Collection configuration:
- Name: **COLLECTION_NAME**
- Vectorizer: multi2vec-weaviate
- imageField: "page_image"
- Model: ModernVBERT/colmodernvbert
- Multi-vector encoding: MUVERA (use `configure.vectorIndex.multiVector.encoding.muvera()`)
- Compression: Rotational Quantization 8 bits (use `configure.vectorIndex.quantizer.rq({ bits: 8 })`)
- Properties: page_image (blob), page_number (int), document_title (text), source_file (text)
  - Vector name: "page"
  - Store each PDF page as a separate object
  - Include the document title and source filename as text properties for filtering
  - Add appropriate descriptions for each property

### CLI requirements (commander):
- --path: one or more inputs; each can be a PDF file path or a directory
- --no-recursive: default recursive is true; when a directory is given, search for PDFs recursively; use --no-recursive to disable
- --glob: optional; override the default search pattern (default "**/*.pdf" when recursive else "*.pdf")
- --collection-name: **COLLECTION_NAME** from env or "Documents"
- --vector-name: optional; default "page"
- --format: optional; one of png/jpg; default png
- --delete-and-recreate: optional flag; if set, delete the collection if it exists and recreate it
- --dry-run: optional flag; discover files and count pages without writing to Weaviate

### Import requirements:
- Validate all input paths exist
- If no PDFs found, exit with helpful guidance
- Make sure the import script is readable
- Open PDFs with `mupdf.Document.openDocument(buffer, "application/pdf")`
- Render each page with `page.toPixmap()` using a scale matrix for ~200 DPI
- Convert to base64 with `Buffer.from(pixmap.asPNG()).toString("base64")` (or `asJPEG` for jpg)
- Batch objects using `collection.data.insertMany()` with a batch size of 20
- Check `response.hasErrors` and iterate `response.errors` after each batch, logging any failed objects
- Log and report progress: file name, pages processed, total objects, and any errors
- Skip pages that fail conversion rather than aborting the entire import

### Output
- After installing dependencies, inspect the `weaviate-client` package (see docs at https://docs.weaviate.io/weaviate/client-libraries/typescript) for the correct collection creation API before writing code
- Provide the full TypeScript file, with helpful comments where applicable
- The file should be ready to run as: `npx tsx import.ts --path ./pdfs`
- The package dependencies should be ready to install as: `npm install`
- Keep secrets in env vars; do not print API keys
