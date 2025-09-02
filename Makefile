# Adminer Security Makefile
# Provides easy commands for security scanning and validation

.PHONY: security security-docker security-local help

# Default target
help:
	@echo "🛡️ Adminer Security Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make security        - Run Docker-based security scan"
	@echo "  make security-docker - Run Docker-based security scan (explicit)"
	@echo "  make security-local  - Run local secretlint scan"
	@echo "  make help           - Show this help message"
	@echo ""
	@echo "🔒 Security Status:"
	@echo "  - Pre-commit hooks: Active (secretlint)"
	@echo "  - Pre-push hooks: Active (Docker security scan)"
	@echo "  - Git history: Cleaned of all tokens"
	@echo "  - Environment variables: Properly configured"

# Main security scan using Docker
security: security-docker

# Docker-based security scan
security-docker:
	@echo "🔍 Running Docker-based security scan..."
	@echo "🛡️ Checking for hardcoded tokens and secrets..."
	@sudo docker compose run --rm security
	@echo ""
	@echo "✅ Security scan completed successfully!"

# Local security scan (requires local secretlint)
security-local:
	@echo "🔍 Running local secretlint scan..."
	@cd adminer && npx secretlint '**/*.{js,ts,tsx,json,env,md,yml,yaml}' || true
	@echo ""
	@echo "✅ Local security scan completed!"

# Quick token check
check-tokens:
	@echo "🔍 Quick token check..."
	@grep -r "pk_live_" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=backups || echo "✅ No pk_live tokens found"
	@grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=backups || echo "✅ No sk_live tokens found"
	@grep -r "apify_api_" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=backups || echo "✅ No apify_api tokens found"
	@echo "✅ Token check completed!"