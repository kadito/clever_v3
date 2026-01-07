# Implementation Plan: PNPM Migration

## Overview

Migrate the CLEVER Dashboard monorepo from npm workspaces to pnpm workspaces through a systematic approach that preserves functionality while gaining performance benefits. The implementation includes configuration updates, documentation changes, and comprehensive verification.

## Tasks

- [x] 1. Pre-migration preparation and backup
  - Create backup of current package-lock.json and package.json files
  - Document current npm workspace functionality for comparison
  - Verify all current workflows work before migration
  - _Requirements: 6.1, 6.3_

- [x] 2. Install and configure pnpm
  - Install pnpm globally (version >=8.0.0)
  - Create pnpm-workspace.yaml configuration file
  - Create .npmrc with pnpm-specific settings
  - _Requirements: 1.1, 4.1_

- [x] 3. Update root package.json for pnpm
  - Replace npm workspace commands with pnpm equivalents in scripts
  - Add pnpm version requirement to engines field
  - Update workspace-related configurations
  - _Requirements: 1.3, 2.3, 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update workspace package.json files
  - Update internal dependencies to use workspace:* protocol
  - Verify package names and structure remain unchanged
  - _Requirements: 1.4, 4.2_

- [x] 5. Migrate dependencies and lockfile
  - Remove package-lock.json and node_modules
  - Run pnpm install to create pnpm-lock.yaml
  - Verify dependency resolution and symlink structure
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 6. Update documentation files
  - [x] 6.1 Update .kiro/tech-constraints.md
    - Replace npm references with pnpm
    - Update build system documentation
    - Add pnpm version requirements
    - _Requirements: 2.1_

  - [x] 6.2 Update .kiro/architecture.md
    - Replace npm workspace commands with pnpm equivalents
    - Update technology stack section
    - Add pnpm benefits explanation
    - _Requirements: 2.2_

  - [x] 6.3 Update .kiro/coding-standards.md
    - Update any npm-specific references to pnpm
    - _Requirements: 2.1_

- [x] 7. Verify tool compatibility
  - [x] 7.1 Test TypeScript compilation
    - Run pnpm type-check across all workspaces
    - Verify project references work with pnpm symlinks
    - _Requirements: 4.3, 5.1_

  - [x] 7.2 Test ESLint functionality
    - Run pnpm lint across all workspaces
    - Verify ESLint finds dependencies in pnpm structure
    - _Requirements: 5.2_

  - [x] 7.3 Test Vite build process
    - Run pnpm build for frontend package
    - Verify Vite resolves pnpm dependencies correctly
    - _Requirements: 5.3_

  - [x] 7.4 Test Wrangler compatibility
    - Run Wrangler commands with pnpm dependencies
    - Add shamefully-hoist if needed for Cloudflare Workers
    - _Requirements: 5.4_

- [-] 8. Verify development workflows
  - [x] 8.1 Test development server
    - Run pnpm dev and verify all services start
    - Test hot reload and development features
    - _Requirements: 3.1, 6.1_

  - [x] 8.2 Test build process
    - Run pnpm build and verify all packages build successfully
    - Check build artifacts are created correctly
    - _Requirements: 3.2, 6.1_

  - [ ] 8.3 Test testing workflow
    - Run pnpm test and verify tests execute across workspaces
    - Verify test coverage and reporting work
    - _Requirements: 3.3, 6.1_

- [ ] 9. Performance verification and documentation
  - Measure and document installation time improvements
  - Measure and document disk usage reduction
  - Compare build times before and after migration
  - _Requirements: 4.1, 4.2_

- [ ] 10. Create migration verification tests
  - [ ] 10.1 Create automated verification script
    - Test that pnpm commands work correctly
    - Test that npm commands are no longer used
    - Verify file structure and dependencies
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 10.2 Create rollback verification script
    - Test rollback process works correctly
    - Verify npm workspace restoration
    - _Requirements: 6.3_

- [x] 11. Final checkpoint and documentation
  - Ensure all tests pass and workflows function correctly
  - Update any remaining documentation with pnpm references
  - Create migration summary with performance improvements
  - Ask the user if any issues arise or additional verification is needed
  - _Requirements: 6.1, 6.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster migration
- Each task references specific requirements for traceability
- Rollback instructions are available if issues occur during migration
- Performance improvements should be measurable and documented
- All existing functionality must be preserved throughout the migration