# Design Document

## Overview

This design outlines the migration from npm workspaces to pnpm workspaces for the CLEVER Dashboard monorepo. The migration will leverage pnpm's superior performance, disk efficiency, and strict dependency management while maintaining the existing project structure and development workflows.

## Architecture

### Current State (npm)
- npm workspaces with TypeScript project references
- Three packages: @clever/shared, @clever/frontend, @clever/backend
- package-lock.json for dependency locking
- npm scripts for workspace operations

### Target State (pnpm)
- pnpm workspaces with same TypeScript project references
- Same three packages with identical structure
- pnpm-lock.yaml for dependency locking
- pnpm workspace commands for operations
- Content-addressable storage with hard links for dependencies

### Migration Benefits
- **Disk Efficiency**: ~40% reduction in node_modules size through hard linking
- **Installation Speed**: ~50% faster installs compared to npm
- **Strict Dependencies**: Prevention of phantom dependencies
- **Better Hoisting**: Intelligent dependency hoisting without conflicts

## Components and Interfaces

### Workspace Configuration

**pnpm-workspace.yaml**
```yaml
packages:
  - 'packages/*'
```

This replaces npm's workspace configuration in package.json and provides explicit workspace definition.

### Package Manager Interface

**Root package.json Scripts**
```json
{
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm -r build", 
    "test": "pnpm -r test",
    "type-check": "pnpm -r type-check",
    "lint": "pnpm -r lint",
    "format": "pnpm -r format"
  }
}
```

**Workspace-specific Commands**
- `pnpm --filter @clever/frontend dev` - Run dev in specific workspace
- `pnpm --filter @clever/backend build` - Build specific workspace
- `pnpm add -w <package>` - Add dependency to workspace root

### Dependency Management

**Workspace Protocol**
Internal dependencies will use `workspace:*` protocol:
```json
{
  "dependencies": {
    "@clever/shared": "workspace:*"
  }
}
```

**Node Linker Strategy**
- Use default `isolated` node linker for strict dependency management
- Fallback to `hoisted` if compatibility issues arise with Cloudflare Workers

### Tool Compatibility

**TypeScript Project References**
- Maintain existing tsconfig.json structure
- pnpm's symlink strategy works seamlessly with TypeScript
- No changes needed to project references

**Vite Configuration**
- Vite automatically resolves pnpm's symlinked dependencies
- No configuration changes required

**Wrangler Compatibility**
- Wrangler works with pnpm-installed dependencies
- May need `shamefully-hoist` for some Cloudflare Workers edge cases

## Data Models

### Configuration Files

**pnpm-workspace.yaml**
```yaml
packages:
  - 'packages/*'
```

**.npmrc (pnpm configuration)**
```ini
# Use isolated node linker for strict dependencies
node-linker=isolated

# Enable shamefully-hoist if needed for Cloudflare Workers
# shamefully-hoist=true

# Store location (optional)
# store-dir=~/.pnpm-store
```

**Updated package.json (root)**
```json
{
  "name": "clever-dashboard",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "check-all": "pnpm -r type-check && pnpm -r lint && pnpm -r format:check",
    "type-check": "pnpm -r type-check",
    "lint": "pnpm -r lint",
    "lint:fix": "pnpm -r lint:fix",
    "format": "pnpm -r format",
    "format:check": "pnpm -r format:check"
  },
  "devDependencies": {
    "@types/node": ">=18.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### Documentation Updates

**Technology Stack Updates**
- Replace npm references with pnpm in tech.md
- Update command examples to use pnpm syntax
- Add pnpm version requirement (>=8.0.0)

**Architecture Documentation**
- Update build system section to reference pnpm
- Add pnpm workspace benefits explanation
- Update command examples throughout

## Correctness Properties

Let me analyze the acceptance criteria for testability using the prework tool:

<function_calls>
<invoke name="prework">
<parameter name="featureName">pnpm-migration

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, most acceptance criteria are specific examples rather than universal properties. The migration involves concrete configuration changes and verification steps rather than behaviors that need to hold across all inputs.

**Example 1: Package Manager Verification**
Verify that pnpm is correctly installed and configured as the package manager
**Validates: Requirements 1.1**

**Example 2: Lockfile Format Verification**
Verify that pnpm-lock.yaml exists and package-lock.json is removed after installation
**Validates: Requirements 1.2**

**Example 3: Workspace Command Execution**
Verify that pnpm workspace commands execute successfully
**Validates: Requirements 1.3, 3.4**

**Example 4: Monorepo Structure Preservation**
Verify that all workspace packages maintain their structure and naming
**Validates: Requirements 1.4**

**Example 5: Documentation Updates**
Verify that documentation files contain pnpm references and remove npm references
**Validates: Requirements 2.1, 2.2, 2.3, 6.4**

**Example 6: Development Workflow Preservation**
Verify that core development commands (dev, build, test) work correctly
**Validates: Requirements 3.1, 3.2, 3.3, 6.1**

**Example 7: Dependency Management Verification**
Verify that pnpm creates proper symlink structure and prevents phantom dependencies
**Validates: Requirements 4.1, 4.2, 4.4**

**Example 8: Tool Compatibility Verification**
Verify that TypeScript, ESLint, Vite, and Wrangler work with pnpm dependencies
**Validates: Requirements 4.3, 5.1, 5.2, 5.3, 5.4**

## Error Handling

### Migration Rollback Strategy

**Backup Creation**
- Create backup of package-lock.json before deletion
- Backup original package.json scripts
- Backup original documentation files

**Rollback Process**
1. Remove pnpm-lock.yaml and .npmrc
2. Restore package-lock.json from backup
3. Restore original package.json scripts
4. Restore original documentation
5. Run `npm install` to restore npm workspace state

**Error Detection**
- Command execution failures during verification
- Build failures after migration
- Test failures after migration
- Tool compatibility issues

### Compatibility Issues

**Cloudflare Workers Compatibility**
- If Wrangler fails with pnpm dependencies, enable `shamefully-hoist=true` in .npmrc
- Monitor for module resolution errors in Worker runtime

**TypeScript Resolution Issues**
- Verify TypeScript project references work with pnpm symlinks
- Check for path resolution issues in IDE

**Tool Integration Problems**
- ESLint may need configuration updates for pnpm node_modules structure
- Vite should work automatically but monitor for resolution issues

## Testing Strategy

### Dual Testing Approach

**Unit Tests**: Verify specific migration steps and configuration changes
- Test individual file updates (package.json, documentation)
- Test command execution success
- Test file system structure changes

**Integration Tests**: Verify end-to-end workflows after migration
- Test complete development workflow (install → dev → build → test)
- Test workspace-specific operations
- Test tool compatibility across the entire stack

### Verification Test Suite

**Pre-Migration Tests**
- Verify current npm workspace functionality
- Document current performance baselines
- Test all existing workflows

**Post-Migration Tests**
- Verify pnpm workspace functionality
- Compare performance improvements
- Test all migrated workflows
- Verify tool compatibility

**Test Configuration**
- Use Vitest for test execution (already configured in project)
- Create migration-specific test suite in `scripts/migration-tests/`
- Include both automated tests and manual verification checklists

### Performance Validation

**Metrics to Track**
- Installation time (npm vs pnpm)
- Disk usage (node_modules size)
- Build time comparison
- Development server startup time

**Benchmarking Process**
1. Measure baseline performance with npm
2. Perform migration
3. Measure performance with pnpm
4. Document improvements and any regressions