# Adminer Billing System - Quick Commands
# Usage: make <target>

.PHONY: build dev smoke preflight

build:
	cd apps/api && npm run prebuild && npm run build

dev:
	cd apps/api && ./scripts/dev-with-env.sh

smoke:
	./scripts/smoke-test-production.sh

preflight:
	./scripts/smoke/preflight_check.sh

# Quick health checks
health:
	cd apps/api && make health

billing:
	cd apps/api && make billing

candidates:
	cd apps/api && make candidates

# Environment validation
env-check:
	cd apps/api && npm run prebuild

# Development helpers
install:
	cd apps/api && npm install
	cd apps/web && npm install

clean:
	rm -rf apps/api/.next apps/api/node_modules/.cache
	rm -rf apps/web/dist apps/web/node_modules/.cache

# Git operations
push:
	git add . && git commit -m "feat: $(shell date +%Y-%m-%d_%H-%M-%S)" && git push origin chore/scanner-enhancements 