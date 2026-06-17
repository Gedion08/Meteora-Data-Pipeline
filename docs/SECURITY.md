# Security

This document outlines security practices and processes for the Meteora Data Pipeline project.

## Vulnerability Reporting

If you discover a security vulnerability, please email [security@example.com](mailto:security@example.com) instead of using the issue tracker. 

Please do not publicly disclose the vulnerability until we have had an opportunity to address it.

## Security Scanning

### Static Analysis (CodeQL)

CodeQL analysis runs automatically on every push and pull request to detect potential security issues in the code.

- Workflow: `.github/workflows/codeql.yml`
- Results: Available in GitHub Security tab

### Dependency Scanning

We use multiple tools to monitor dependencies for known vulnerabilities:

#### npm audit

Runs on every CI build to check for vulnerabilities in dependencies:

```bash
npm audit
```

Moderate and higher severity issues are reported in CI logs.

#### Dependabot

Automatically checks for dependency updates and security patches:

- Configuration: `.github/dependabot.yml`
- Creates pull requests for updates
- Scans: npm packages, Docker base images, GitHub Actions

#### SBOM Generation

A Software Bill of Materials (SBOM) is generated in CycloneDX format for each build:

- Generated using: `cyclonedx-npm`
- Uploaded as artifact: `bom.xml`
- Use for tracking supply chain components

## Best Practices

- **Keep dependencies updated**: Use Dependabot-generated PRs to stay current
- **Review security advisories**: Check GitHub Security tab regularly
- **Minimal dependencies**: Only install packages you actually need
- **Principle of least privilege**: Database user should have minimal required permissions
- **Secret management**: Never commit secrets; use GitHub Secrets and environment variables
- **API access**: Use HTTPS for all external API calls; validate TLS certificates

## Environment Security

### Sensitive Variables

The following variables should never be committed:

- `DATABASE_URL` (contains credentials)
- `LOKI_URL` (if behind authentication)
- `API_KEYS` (for any external services)
- `SLACK_WEBHOOK` (for alerts)

Store these in:
- `.env` (local development, gitignored)
- GitHub Secrets (CI/CD)
- HashiCorp Vault (production)

### Docker Image Security

- Built on `node:lts-alpine` for minimal attack surface
- Multi-stage builds (not implemented yet)
- Scan images with: `docker scan <image>`

## Compliance

- Log retention: Configure based on compliance requirements
- Data retention: Implement data deletion policies for stale pool data
- Access control: Implement database-level access controls

## Incident Response

1. **Discovery**: Report via security email
2. **Triage**: Assess severity and impact
3. **Patch**: Develop and test fix
4. **Release**: Issue security patch release
5. **Announce**: Publish security advisory
6. **Monitor**: Watch for exploitation attempts

## Security Policy Updates

This policy is reviewed quarterly. Changes are announced in releases.

---

**Last Updated**: 2026-06-16
