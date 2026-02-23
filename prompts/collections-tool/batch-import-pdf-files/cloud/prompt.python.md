---
id: batch-import-pdf-files
title: Import Multiple PDF Files
feature: collections-tool
environment: cloud
language: python
estimated_time_minutes: 5
---

Write a Python script using the Weaviate v4 client to batch-import PDF files into a Weaviate Cloud collection, using ColPali-style multi-vector embeddings. 

## Prerequisites
1. Get your **WEAVIATE_URL** (REST Endpoint) and **WEAVIATE_API_KEY** (Admin API Key)
2. Choose an appropriate collection name **COLLECTION_NAME**

## Installation

Required packages:
- `weaviate-client>=4.19.0` - Weaviate Python client for database operations
- `fitz` - PyMuPDF for PDF rendering
- `base64` - for encoding/decoding image
- `argparse` - for CLI
- `pathlib` - for paths
- `python-dotenv` - Load environment variables from .env file

## Project Structure

Create:
- `import.py` - Batch import script
- `.env` - Environment variables with WEAVIATE_URL, WEAVIATE_API_KEY
- `requirements.txt` - List package dependencies 

## Implementation Details

### Connection
- Connect to Weaviate Cloud using environment variables: **WEAVIATE_URL** and **WEAVIATE_API_KEY**
- Configure request timeouts suitable for large batches
- Always close the client at the end

### Collection configuration:
- Name: **COLLECTION_NAME**
- Vectorizer: multi2vec-weaviate (use `vector_config=Configure.MultiVectors.multi2VecWeaviate()` syntax)
- Model: ModernVBERT/colmodernvbert
- Multi-vector encoding: MUVERA (for efficient storage and retrieval) 
- Compression: Rotational Quantization 8 bits
- Properties: page_image (blob), page_number (int), document_title (text), source_file (text)
  - Vector name: "page"
  - Store each PDF page as a separate object
  - Include the document title and source filename as text properties for filtering
  - Add appropriate descriptions for each property
 
### CLI requirements (argpase):
- --path: one or more inputs; each can be a PDF file path or a directory
- --recursive: default true; when a directory is given, search for PDFs recursively
- --glob: optional; override the default search pattern (default "**/*.pdf" when recursive else "*.pdf")
- --collection_name: **COLLECTION_NAME**
- --vector_name: optional; default "page"
- --format: optional; one of png/jpg/webp/tiff; default png
- --delete-and-recreate: optional flag; if set, delete the collection if it exists and recreate it
- --dry-run: optional flag; discover files and count pages without writing to Weaviate

### Import requirements:
- Validate all input paths exist
- If no PDFs found, exit with helpful guidance
- Make sure the import script is readable
- Convert each PDF page to a base64-encoded image
- Use server-side batching if available (v1.34+), otherwise use client-side batching with batch size of 20 and 2 concurrent requests (lower batch size due to large object sizes)
- Check batch.number_errors every 20 objects (where batch is the context manager variable) and log any failed objects
- Log and report progress: file name, pages processed, total objects, and any errors
- Skip pages that fail conversion rather than aborting the entire import`

### Output
- After installing dependencies, inspect the `weaviate-client` package (see docs at https://docs.weaviate.io/weaviate/client-libraries/python) for the correct collection creation API before writing code
- Provide the full Python file, with helpful comments where applicable
- The file should be ready to run as: `python import.py --path ./pdfs`
- The package dependencies should be ready to install as: `pip install -r requirements.txt`
- Keep secrets in env vars; do not print API keys
