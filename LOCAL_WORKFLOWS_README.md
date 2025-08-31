# 🚀 Local GitHub Actions with Act

This setup allows you to run all your GitHub Actions workflows locally without needing GitHub Actions or dealing with billing issues.

## 📋 Prerequisites

- **Docker**: Must be running
- **Linux/macOS**: Act works best on these platforms
- **Git**: For repository access

## 🛠️ Installation

Act is already installed in `~/.local/bin`. If you need to reinstall:

```bash
mkdir -p ~/.local/bin
curl -L https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz | tar -xz -C ~/.local/bin act
export PATH="$HOME/.local/bin:$PATH"
```

## 🎯 Available Scripts

### **Run All Workflows**
```bash
./scripts/run-local-workflows.sh
```

### **Run Individual Workflows**
```bash
# Monorepo CI (main workflow)
./scripts/run-monorepo-ci.sh

# Deploy Wait & Smoke
./scripts/run-deploy-smoke.sh

# Smoke Tests
./scripts/run-smoke-tests.sh
```

### **Test Setup**
```bash
./scripts/test-act-setup.sh
```

## 🔧 Configuration

### **Environment Variables**
- **`.env.local.act`**: Contains environment variables for local workflows
- **`.actrc`**: Act configuration file

### **Customization**
Edit `.env.local.act` to add/modify environment variables:
```bash
# Example environment variables
VERCEL_TOKEN=your_token_here
CLERK_SECRET_KEY=your_key_here
DATABASE_URL=your_db_url_here
```

## 📊 Workflow Details

### **1. Monorepo CI** (`.github/workflows/monorepo-ci.yml`)
- **Purpose**: Main CI pipeline with guards, health checks, and production smoke tests
- **Triggers**: Push to main, schedule
- **Jobs**: check-guards, health, smoke_prod

### **2. Deploy Wait & Smoke** (`.github/workflows/deploy-wait-and-smoke.yml`)
- **Purpose**: Build SPA, deploy to Vercel, run smoke tests
- **Triggers**: Push to main
- **Jobs**: deploy-wait-and-smoke

### **3. Smoke Tests** (`.github/workflows/smoke.yml`)
- **Purpose**: Production site health checks
- **Triggers**: Push to main
- **Jobs**: smoke

### **4. Promote and Smoke** (`.github/workflows/promote-and-smoke.yml`)
- **Purpose**: Promotion workflow with smoke tests
- **Triggers**: Push to main
- **Jobs**: promote-and-smoke

## 🚨 Troubleshooting

### **Docker Issues**
```bash
# Check Docker status
docker info

# Start Docker if needed
sudo systemctl start docker
```

### **Act Issues**
```bash
# Check Act version
act --version

# Test with simple workflow
./scripts/test-act-setup.sh
```

### **Environment Variables**
```bash
# Check environment file
cat .env.local.act

# Verify variables are loaded
act workflow -W .github/workflows/monorepo-ci.yml --list --env-file .env.local.act
```

## 💡 Tips

1. **Start with test**: Run `./scripts/test-act-setup.sh` first
2. **Check logs**: Act provides detailed output for debugging
3. **Environment**: Ensure all required environment variables are in `.env.local.act`
4. **Docker**: Keep Docker running while using Act
5. **Workflow debugging**: Use `--dryrun` flag to see what a workflow will do without executing

## 🔄 Running Workflows

### **Quick Start**
```bash
# Test the setup
./scripts/test-act-setup.sh

# Run all workflows
./scripts/run-local-workflows.sh
```

### **Individual Workflow**
```bash
# Run specific workflow
act workflow -W .github/workflows/monorepo-ci.yml --eventpath <(echo '{"push": {}}') --list
```

### **Dry Run**
```bash
# See what a workflow will do without executing
act workflow -W .github/workflows/monorepo-ci.yml --eventpath <(echo '{"push": {}}') --dryrun
```

## 📈 Benefits

- ✅ **No GitHub billing issues**
- ✅ **Faster iteration** (no waiting for remote execution)
- ✅ **Local debugging** capabilities
- ✅ **Offline development** possible
- ✅ **Cost savings** (no GitHub Actions minutes used)
- ✅ **Privacy** (workflows run locally)

---

**Happy local development! 🎉** 