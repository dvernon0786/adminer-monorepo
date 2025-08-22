# Adminer Billing System - Quick Commands
# Usage: make <target>

.PHONY: help preflight smoke diag migrate indexes view

help: ## Show this help
	@echo "🔧 Adminer Billing System - Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

preflight: ## Run preflight health check
	bash scripts/smoke/preflight_check_simple.sh

smoke: ## Run full smoke test
	bash scripts/smoke/adminer_smoke.sh

diag: ## Get system diagnostics
	curl -s http://localhost:3000/api/admin/diagnostics | jq .

migrate: ## Run all database migrations in order
	psql "$$DATABASE_URL" -f apps/api/scripts/create-tables.sql && \
	psql "$$DATABASE_URL" -f apps/api/scripts/2025-01-22_billing.sql && \
	psql "$$DATABASE_URL" -f apps/api/scripts/2025-08-22_add_current_period_end.sql && \
	psql "$$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_audit.sql

indexes: ## Create performance indexes
	psql "$$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_performance.sql

view: ## Create canonical billing view
	psql "$$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_view.sql

setup: migrate indexes view ## Complete setup: migrations + indexes + view
	@echo "✅ Complete billing system setup complete!"

health: ## Quick health check (status code only)
	curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/admin/diagnostics

billing: ## Show only billing-related diagnostics
	curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.name | test("billing|dodo|dry_run")) | {name, ok, details}'

candidates: ## Show current downgrade candidates
	curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.name=="dry_run_candidates") | .details'

audit: ## Show recent billing audit activity
	curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.name=="billing_audit_recent") | .details' 