.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "%s\n" \
		"make install-hooks     wire .githooks" \
		"make dev               run Vite dev server" \
		"make build             build Pages-ready docs/" \
		"make data              not applicable in Mode A" \
		"make test              run unit tests" \
		"make test-integration  no integration suite in Mode A v1" \
		"make smoke             build, serve docs/, run Playwright happy path" \
		"make lint              run ESLint and Prettier check" \
		"make fmt               autoformat source/docs" \
		"make pages-preview     serve docs/ with the GitHub Pages base path" \
		"make release           run checks and tag package version" \
		"make clean             remove build/cache output"

install-hooks:
	git config core.hooksPath .githooks

dev:
	npm run dev

build:
	npm run build

data:
	@echo "Mode A has no static data-generation pipeline."

test:
	npm run test

test-integration:
	@echo "No integration tests are required for Mode A v1."

smoke:
	npm run smoke

lint:
	npm run lint
	npm run fmt:check

fmt:
	npm run fmt

pages-preview:
	npm run pages:preview

docker-build:
	@echo "Mode A skips Docker."

docker-push:
	@echo "Mode A skips GHCR image publishing."

release: test build smoke
	git tag "v$$(node -p "require('./package.json').version")"

compose-up:
	@echo "Mode A has no Docker Compose stack."

compose-down:
	@echo "Mode A has no Docker Compose stack."

hooks-pre-commit:
	bash .githooks/pre-commit

hooks-commit-msg:
	bash .githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	bash .githooks/pre-push

clean:
	rm -rf coverage node_modules/.tmp tmp
