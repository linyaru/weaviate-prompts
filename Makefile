.PHONY: install index validate check clean list help

## Setup

install: ## Install pre-commit hooks
	@pre-commit install
	@echo "Pre-commit hooks installed."

## Development

index: ## Regenerate index.json from prompt frontmatter
	@node scripts/generate-index.js

validate: ## Validate all prompt files (frontmatter, path consistency)
	@node scripts/validate.js

check: ## Run all pre-commit checks against all files
	@pre-commit run --all-files

clean: ## Fix trailing whitespace in prompt files
	@pre-commit run trailing-whitespace --all-files || true
	@pre-commit run end-of-file-fixer --all-files || true

list: ## List all prompt files
	@find prompts -name 'prompt.*.md' | sort | while read f; do \
		echo "  $$f"; \
	done

## Help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
