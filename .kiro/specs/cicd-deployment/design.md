# Design Document: Simple CI/CD Deployment System

## Overview

The CI/CD deployment system uses two simple GitHub Actions workflows to deploy the CLEVER dashboard to Cloudflare Workers. The system handles the pnpm monorepo structure by building packages in correct dependency order (shared first, then frontend and backend) and deploys to environment-specific Cloudflare resources based on Git branch triggers.

The design focuses on simplicity with just two workflows: `deploy-test.yml` and `deploy-prod.yml`, eliminating complexity while ensuring reliable deployments.

## Architecture

### Workflow Strategy

The CI/CD system uses two dedicated deployment workflows:

```mermaid
graph TD
    A[Git Push] --> B{Branch?}
    B -->|test| C[deploy-test.yml]
    B -->|prod| D[deploy-prod.yml]
    B -->|other| E[No Action]
    
    C --> F[Build Packages]
    D --> F
    
    F --> G[@clever/shared]
    G --> H[@clever/frontend]
    G --> I[@clever/backend]
    H --> J[Deploy to Test]
    I --> J
    H --> K[Deploy to Prod]
    I --> K
```

### Package Build Order

The monorepo requires specific build ordering:

```mermaid
graph TD
    A[pnpm install] --> B[@clever/shared build]
    B --> C[@clever/frontend build]
    B --> D[@clever/backend build]
    C --> E[Frontend Assets to KV]
    D --> F[Backend Worker Bundle]
    E --> G[Deploy Unified Worker]
    F --> G
```

### Environment Configuration

| Environment | Worker Name | R2 Bucket | Branch Trigger | Workflow File |
|-------------|-------------|-----------|----------------|---------------|
| Test | clever-dashboard-test | clever-documents-test | test | deploy-test.yml |
| Production | clever-dashboard-prod | clever-documents-prod | prod | deploy-prod.yml |

## Components and Interfaces

### GitHub Actions Workflows

#### Test Deployment Workflow (.github/workflows/deploy-test.yml)
- Triggers on pushes to `test` branch
- Builds all packages in correct order
- Deploys to test environment
- Verifies deployment success

#### Production Deployment Workflow (.github/workflows/deploy-prod.yml)
- Triggers on pushes to `prod` branch
- Builds all packages in correct order
- Deploys to production environment
- Verifies deployment success

### Wrangler Configuration

The system uses the existing wrangler.toml with environment-specific overrides:

#### Base Configuration (wrangler.toml)
- Contains test environment configuration (default)
- Includes shared settings and test resource bindings

#### Production Environment
- Uses `--env production` flag with wrangler
- Overrides test settings with production resources
- Defined in `[env.production]` section of wrangler.toml

## Data Models

### GitHub Actions Secrets

Required secrets for Cloudflare deployment:

```typescript
interface GitHubSecrets {
  CLOUDFLARE_API_TOKEN: string;           // Cloudflare API token
  CLOUDFLARE_ACCOUNT_ID: string;          // Account identifier
}
```

### Build Process

Build steps executed in both workflows:

```typescript
interface BuildProcess {
  steps: [
    'pnpm install --frozen-lockfile',
    'pnpm --filter @clever/shared build',
    'pnpm --filter @clever/frontend build',
    'pnpm --filter @clever/backend build',
    'wrangler deploy [--env production]'
  ];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Let me analyze the acceptance criteria to determine testable properties:

<function_calls>
<invoke name="prework">
<parameter name="featureName">cicd-deployment

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Branch-Based Deployment Triggers
*For any* push to test or prod branch, the corresponding deployment workflow should trigger and complete the build and deployment process
**Validates: Requirements 1.1, 1.2**

### Property 2: Package Build Order
*For any* deployment workflow execution, @clever/shared should build first, followed by @clever/frontend and @clever/backend packages
**Validates: Requirements 1.4, 1.5**

### Property 3: Environment-Specific Resource Usage
*For any* deployment, the workflow should use the correct Cloudflare resources (worker name and R2 bucket) for the target environment
**Validates: Requirements 2.1, 2.2, 3.1, 3.2, 3.3, 3.4**

### Property 4: Asset and Worker Deployment
*For any* successful build, the workflow should upload Vue static assets and deploy the unified worker with proper bindings
**Validates: Requirements 2.3, 2.4**

### Property 5: Deployment Verification
*For any* completed deployment, the workflow should verify the worker is responding correctly
**Validates: Requirements 2.5**

### Property 6: Secure Credential Handling
*For any* Cloudflare API access, the workflow should use encrypted GitHub secrets without exposing credentials in logs
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Build Failure Handling
*For any* failed build step, the workflow should stop execution and provide clear error reporting
**Validates: Requirements 1.7, 4.4**

## Error Handling

### Build Failures
- **Dependency Installation Failures**: Clear error messages about pnpm installation issues
- **Package Build Errors**: Specific build failure messages with package identification
- **Deployment Failures**: Wrangler error output with context

### Configuration Errors
- **Missing Secrets**: Clear guidance on required GitHub secrets
- **Invalid Wrangler Config**: Configuration validation error messages
- **Environment Mismatch**: Branch and environment alignment issues

## Testing Strategy

### Unit Testing Approach
The CI/CD system will be tested using workflow validation and integration tests:

**Workflow Tests:**
- GitHub Actions workflow syntax validation
- Wrangler configuration validation
- Build script execution verification
- Environment variable handling

**Integration Tests:**
- End-to-end deployment simulation in test environment
- Package build order verification
- Security credential handling verification

### Property-Based Testing Configuration
Property-based tests will use GitHub Actions testing framework with minimum 100 iterations per property test. Each test will be tagged with:

**Feature: cicd-deployment, Property {number}: {property_text}**

**Testing Libraries:**
- **GitHub Actions Testing**: Native GitHub Actions workflow testing
- **Wrangler CLI Testing**: Cloudflare Wrangler command validation

### Deployment Verification Tests
Each deployment will include automated verification:

```bash
# Worker health check
curl -f https://${WORKER_URL}/

# Basic API endpoint verification (if available)
curl -f https://${WORKER_URL}/api/health || true
```

The testing strategy ensures reliable deployments while maintaining simplicity and fast feedback loops.