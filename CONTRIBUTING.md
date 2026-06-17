# Contributing to Meteora Data Pipeline

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Meteora Data Pipeline project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 13+
- Docker (for local development)
- Git

### Local Development Setup

1. Fork the repository on GitHub

2. Clone your fork:

```bash
git clone https://github.com/Gedion08/Meteora-Data-Pipeline.git
cd meteora-data-pipeline
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/Gedion08/Meteora-Data-Pipeline.git
```

4. Create a development branch:

```bash
git checkout -b feature/your-feature-name
```

5. Install dependencies:

```bash
npm install
```

6. Set up local database:

```bash
docker-compose up postgres -d
npx prisma generate
npx prisma migrate dev --name init
```

7. Run the pipeline:

```bash
npm run dev
```

## Development Workflow

### Code Style

- **Language**: TypeScript
- **Formatter**: Prettier (run `npm run format` or configure your editor)
- **Linter**: ESLint (enable in your editor)
- **Imports**: Use absolute imports where possible

### Testing

Write tests for new features:

```bash
# Run all tests
npm test

# Run specific test
npm test -- normalize.test.ts

# Watch mode
npm test:watch

# Run with live API calls
RUN_LIVE_INTEGRATION=1 npm test
```

### Commits

Follow conventional commits:

```
feat: add pool filtering by TVL
fix: correct database pool connection logic
docs: update deployment guide
test: add unit tests for normalization
chore: bump dependency versions
```

## Submitting Changes

### Pull Request Process

1. **Keep PRs focused**: One feature/fix per PR
2. **Sync with upstream**:

```bash
git fetch upstream
git rebase upstream/main
```

3. **Push to your fork**:

```bash
git push origin feature/your-feature-name
```

4. **Create PR on GitHub**:
   - Use a descriptive title
   - Reference related issues (#123)
   - Include a summary of changes
   - Include screenshots for UI changes
   - Mention breaking changes if any

5. **CI checks must pass**:
   - All tests pass
   - No linting errors
   - TypeScript build succeeds

6. **Code review**:
   - At least one approval required
   - Address review comments promptly
   - Push additional commits (don't force-push during review)

### PR Template

```markdown
## Description
Brief description of the changes

## Motivation
Why are these changes needed?

## Testing
How were these changes tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commit messages follow conventional commits
```

## Adding Features

### For New Data Sources

1. Create a new ingestion function in `src/pipeline.ts`
2. Add Zod schema for validation
3. Add a normalization function
4. Add database upsert in `src/db.ts`
5. Add tests in `src/__tests__/`
6. Document in README.md

### For New Metrics

1. Add to `src/metrics.ts`
2. Use metric in `src/pipeline.ts`
3. Add to Prometheus alert rules in `monitoring/alerting.yml`
4. Update Grafana dashboard in `monitoring/grafana-dashboard.json`

### For New Configuration

1. Add to `.env.example` and all `.env.*` files
2. Add to Zod schema in `src/config.ts`
3. Document in CONFIG.md

## Reporting Issues

### Bug Reports

Create an issue with:

- **Description**: What is the problem?
- **Steps to Reproduce**: How to trigger it?
- **Expected Behavior**: What should happen?
- **Actual Behavior**: What actually happens?
- **Environment**: OS, Node version, relevant config
- **Logs**: Error messages and stack traces

### Feature Requests

Include:

- **Use Case**: Why is this needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered?
- **Impact**: Who benefits?

## Documentation

### Types of Documentation

1. **README.md** — Quick start and overview
2. **DEPLOYMENT.md** — Local and production deployment
3. **MONITORING.md** — Prometheus and Grafana setup
4. **LOGGING.md** — Tracing and log aggregation
5. **CONFIG.md** — Configuration and secrets
6. **SECURITY.md** — Security practices
7. **PERFORMANCE.md** — Benchmarking and load testing
8. **Runbooks** — Operational procedures (see RUNBOOKS.md)

### Writing Documentation

- Use Markdown format
- Include code examples
- Keep it up to date
- Use clear headings
- Add links to related docs

## Performance & Security

### Performance

- Benchmark before/after for significant changes
- Run `npm run benchmark` to validate
- Profile with Node.js profiler if needed

### Security

- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Keep dependencies updated
- Report security vulnerabilities privately

## Release Process

1. **Version Bumping**: Uses semantic-release (automated)
2. **Changelog**: Auto-generated from commits
3. **GitHub Release**: Created automatically
4. **Docker Image**: Pushed to ghcr.io automatically
5. **npm Publishing**: Optional (configure in semantic-release)

## Questions or Need Help?

- Check existing issues and PRs first
- Create a discussion for general questions
- Ask in pull request if clarification needed
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license (see LICENSE file).

---

Thank you for contributing to Meteora Data Pipeline! 🚀
