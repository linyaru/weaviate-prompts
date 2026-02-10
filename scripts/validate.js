#!/usr/bin/env node

/**
 * Validates all prompt files in prompts/:
 * - Required frontmatter fields are present
 * - frontmatter.feature matches the directory path
 * - frontmatter.environment matches the directory path
 * - frontmatter.language matches the filename
 * - frontmatter.id is consistent across languages within a use-case
 *
 * Usage: node scripts/validate.js
 */

const fs = require("fs");
const path = require("path");

const PROMPTS_DIR = path.join(__dirname, "..", "prompts");
const REQUIRED_FIELDS = ["id", "title", "feature", "environment", "language", "framework"];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    frontmatter[key] = value;
  }
  return frontmatter;
}

function walkPromptFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkPromptFiles(fullPath));
    } else if (item.name.startsWith("prompt.") && item.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

const errors = [];
const promptFiles = walkPromptFiles(PROMPTS_DIR);

if (promptFiles.length === 0) {
  console.log("No prompt files found.");
  process.exit(0);
}

// Track IDs per use-case directory to check consistency
const idsByUseCase = {};

for (const filePath of promptFiles) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);

  if (!fm) {
    errors.push(`${relativePath}: Missing frontmatter block (---)`);
    continue;
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!fm[field]) {
      errors.push(`${relativePath}: Missing required frontmatter field '${field}'`);
    }
  }

  if (!fm.feature || !fm.environment || !fm.language) continue;

  // Parse path: prompts/{feature}/{use-case}/{environment}/prompt.{language}.md
  const parts = relativePath.split(path.sep);
  // parts = ["prompts", feature, use-case, environment, filename]
  if (parts.length !== 5) {
    errors.push(`${relativePath}: Unexpected path depth (expected prompts/{feature}/{use-case}/{environment}/prompt.{lang}.md)`);
    continue;
  }

  const [, dirFeature, dirUseCase, dirEnv, filename] = parts;

  // Extract language from filename: prompt.{language}.md
  const langMatch = filename.match(/^prompt\.(.+)\.md$/);
  const fileLang = langMatch ? langMatch[1] : null;

  // Validate feature matches directory
  if (fm.feature !== dirFeature) {
    errors.push(`${relativePath}: frontmatter feature '${fm.feature}' does not match directory '${dirFeature}'`);
  }

  // Validate environment matches directory
  if (fm.environment !== dirEnv) {
    errors.push(`${relativePath}: frontmatter environment '${fm.environment}' does not match directory '${dirEnv}'`);
  }

  // Validate language matches filename
  if (fileLang && fm.language !== fileLang) {
    errors.push(`${relativePath}: frontmatter language '${fm.language}' does not match filename language '${fileLang}'`);
  }

  // Track ID consistency within use-case
  const useCaseKey = `${dirFeature}/${dirUseCase}/${dirEnv}`;
  if (!idsByUseCase[useCaseKey]) {
    idsByUseCase[useCaseKey] = { id: fm.id, file: relativePath };
  } else if (idsByUseCase[useCaseKey].id !== fm.id) {
    errors.push(
      `${relativePath}: frontmatter id '${fm.id}' does not match id '${idsByUseCase[useCaseKey].id}' from ${idsByUseCase[useCaseKey].file}`
    );
  }
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`Validated ${promptFiles.length} prompt file(s). All good.`);
}
