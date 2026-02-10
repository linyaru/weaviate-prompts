#!/usr/bin/env node

/**
 * Walks the prompts/ directory, parses YAML frontmatter from each prompt file,
 * and writes index.json to the repo root.
 *
 * Directory convention: prompts/{feature}/{use-case}/{environment}/prompt.{language}.md
 *
 * Usage: node scripts/generate-index.js
 *
 * No dependencies required — uses only Node built-ins.
 */

const fs = require("fs");
const path = require("path");

const PROMPTS_DIR = path.join(__dirname, "..", "prompts");
const INDEX_PATH = path.join(__dirname, "..", "index.json");

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

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

// Read existing index to preserve hand-authored fields (description, features, etc.)
let existingIndex = { version: "1.0.0", prompts: {} };
if (fs.existsSync(INDEX_PATH)) {
  try {
    existingIndex = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
  } catch (e) {
    console.warn("WARNING: Could not parse existing index.json, starting fresh.");
  }
}

const promptFiles = walkPromptFiles(PROMPTS_DIR);
const grouped = {};

for (const filePath of promptFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm) {
    console.warn(`WARNING: No frontmatter in ${filePath}, skipping.`);
    continue;
  }

  const feature = fm.feature;
  const language = fm.language;
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  if (!grouped[feature]) {
    // Preserve existing top-level metadata if it exists
    const existing = existingIndex.prompts?.[feature] || {};
    grouped[feature] = {
      id: fm.id,
      description: existing.description || "",
      detailedDescription: existing.detailedDescription || "",
      features: existing.features || [],
      languages: {},
    };
  }

  // Merge with existing language entry to preserve hand-authored fields
  // (e.g. sections, packages, clientApi)
  const existingLang =
    existingIndex.prompts?.[feature]?.languages?.[language] || {};
  grouped[feature].languages[language] = {
    ...existingLang,
    path: relativePath,
    title: fm.title,
    framework: fm.framework,
    environment: fm.environment,
  };
}

// Sort languages within each feature for stable output
for (const feature of Object.keys(grouped)) {
  const langs = grouped[feature].languages;
  const sorted = {};
  for (const key of Object.keys(langs).sort()) {
    sorted[key] = langs[key];
  }
  grouped[feature].languages = sorted;
}

const index = {
  version: existingIndex.version || "1.0.0",
  prompts: grouped,
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");

const totalFiles = promptFiles.length;
const totalFeatures = Object.keys(grouped).length;
console.log(
  `Generated index.json: ${totalFeatures} feature(s), ${totalFiles} prompt file(s).`
);
