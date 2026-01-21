#!/usr/bin/env node

/**
 * Authentication Integration Verification Script
 *
 * This script verifies that the authentication system is properly integrated
 * by checking code structure, configuration, and dependencies without
 * requiring a running server.
 *
 * Requirements: All requirements integration
 */

const fs = require('fs');
const path = require('path');

class AuthIntegrationVerifier {
  constructor() {
    this.results = {
      dependencies: false,
      configuration: false,
      backendIntegration: false,
      frontendIntegration: false,
      sharedTypes: false,
      routeProtection: false,
      errorHandling: false,
    };
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
      }[type] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addIssue(category, message) {
    this.issues.push({ category, message });
    this.log(`Issue in ${category}: ${message}`, 'warning');
  }

  checkFileExists(filePath, description) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      this.addIssue('file-structure', `Missing ${description}: ${filePath}`);
      return false;
    }
    return true;
  }

  checkFileContains(filePath, searchText, description) {
    if (!this.checkFileExists(filePath, description)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes(searchText)) {
        this.addIssue('content', `${description} missing "${searchText}" in ${filePath}`);
        return false;
      }
      return true;
    } catch (error) {
      this.addIssue('file-read', `Cannot read ${filePath}: ${error.message}`);
      return false;
    }
  }

  verifyDependencies() {
    this.log('Verifying authentication dependencies...', 'info');

    const checks = [
      // Backend dependencies
      {
        file: 'packages/backend/package.json',
        search: '@hono/clerk-auth',
        desc: 'Backend Clerk dependency',
      },
      // Frontend dependencies
      {
        file: 'packages/frontend/package.json',
        search: '@clerk/vue',
        desc: 'Frontend Clerk dependency',
      },
      // Shared package
      {
        file: 'packages/shared/package.json',
        search: '"name": "@clever/shared"',
        desc: 'Shared package configuration',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.dependencies = allPassed;
    if (allPassed) {
      this.log('Dependencies verification passed', 'success');
    }
  }

  verifyConfiguration() {
    this.log('Verifying authentication configuration...', 'info');

    const checks = [
      // Wrangler configuration
      {
        file: 'wrangler.toml',
        search: 'CLERK_PUBLISHABLE_KEY',
        desc: 'Wrangler Clerk configuration',
      },
      // Frontend environment
      {
        file: 'packages/frontend/.env',
        search: 'VITE_CLERK_PUBLISHABLE_KEY',
        desc: 'Frontend Clerk configuration',
      },
      // Backend test environment
      {
        file: 'packages/backend/.env.test',
        search: 'CLERK_SECRET_KEY',
        desc: 'Backend test Clerk configuration',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.configuration = allPassed;
    if (allPassed) {
      this.log('Configuration verification passed', 'success');
    }
  }

  verifyBackendIntegration() {
    this.log('Verifying backend authentication integration...', 'info');

    const checks = [
      // Clerk middleware
      {
        file: 'packages/backend/src/middleware/clerk.ts',
        search: 'requireAuth',
        desc: 'Clerk middleware implementation',
      },
      // API routes protection
      {
        file: 'packages/backend/src/routes/api.ts',
        search: 'requireAuth',
        desc: 'API routes authentication',
      },
      // Backend types
      {
        file: 'packages/backend/src/types/auth.ts',
        search: 'ClerkBindings',
        desc: 'Backend authentication types',
      },
      // Main app integration
      {
        file: 'packages/backend/src/index.ts',
        search: "app.route('/api', api)",
        desc: 'API routes integration',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.backendIntegration = allPassed;
    if (allPassed) {
      this.log('Backend integration verification passed', 'success');
    }
  }

  verifyFrontendIntegration() {
    this.log('Verifying frontend authentication integration...', 'info');

    const checks = [
      // Main app Clerk plugin
      {
        file: 'packages/frontend/src/main.ts',
        search: 'clerkPlugin',
        desc: 'Clerk plugin integration',
      },
      // Authentication store
      {
        file: 'packages/frontend/src/stores/auth.ts',
        search: 'useAuthStore',
        desc: 'Authentication store',
      },
      // Authentication composable
      {
        file: 'packages/frontend/src/composables/useAuth.ts',
        search: 'useAuth',
        desc: 'Authentication composable',
      },
      // Router integration
      {
        file: 'packages/frontend/src/router/index.ts',
        search: 'requiresAuth',
        desc: 'Router authentication guards',
      },
      // SignIn view
      {
        file: 'packages/frontend/src/views/SignInView.vue',
        search: 'SignIn',
        desc: 'SignIn view component',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.frontendIntegration = allPassed;
    if (allPassed) {
      this.log('Frontend integration verification passed', 'success');
    }
  }

  verifySharedTypes() {
    this.log('Verifying shared type integration...', 'info');

    const checks = [
      // Shared types definition
      {
        file: 'packages/shared/src/types.ts',
        search: 'UserContext',
        desc: 'UserContext interface',
      },
      // Shared index exports
      {
        file: 'packages/shared/src/index.ts',
        search: 'export',
        desc: 'Shared package exports',
      },
      // Backend imports shared types
      {
        file: 'packages/backend/src/middleware/clerk.ts',
        search: '@clever/shared',
        desc: 'Backend imports shared types',
      },
      // Frontend imports shared types
      {
        file: 'packages/frontend/src/stores/auth.ts',
        search: '@clever/shared',
        desc: 'Frontend imports shared types',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.sharedTypes = allPassed;
    if (allPassed) {
      this.log('Shared types verification passed', 'success');
    }
  }

  verifyRouteProtection() {
    this.log('Verifying route protection integration...', 'info');

    const checks = [
      // Router guards
      {
        file: 'packages/frontend/src/router/index.ts',
        search: 'beforeEach',
        desc: 'Router navigation guards',
      },
      // Protected routes configuration
      {
        file: 'packages/frontend/src/router/index.ts',
        search: 'requiresAuth: true',
        desc: 'Protected routes configuration',
      },
      // SignIn route configuration
      {
        file: 'packages/frontend/src/router/index.ts',
        search: 'requiresAuth: false',
        desc: 'SignIn route configuration',
      },
      // API route protection
      {
        file: 'packages/backend/src/routes/api.ts',
        search: "api.use('/content/*', requireAuth",
        desc: 'API content routes protection',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.routeProtection = allPassed;
    if (allPassed) {
      this.log('Route protection verification passed', 'success');
    }
  }

  verifyErrorHandling() {
    this.log('Verifying error handling integration...', 'info');

    const checks = [
      // Backend error middleware
      {
        file: 'packages/backend/src/middleware/error.ts',
        search: 'errorHandler',
        desc: 'Backend error handling middleware',
      },
      // API error handling
      {
        file: 'packages/backend/src/routes/api.ts',
        search: 'handleAuthError',
        desc: 'API authentication error handling',
      },
      // Frontend error notification
      {
        file: 'packages/frontend/src/components/common/ErrorNotification.vue',
        search: '<template>',
        desc: 'Frontend error notification component',
      },
      // App error integration
      {
        file: 'packages/frontend/src/App.vue',
        search: 'ErrorNotification',
        desc: 'App error notification integration',
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (!this.checkFileContains(check.file, check.search, check.desc)) {
        allPassed = false;
      }
    }

    this.results.errorHandling = allPassed;
    if (allPassed) {
      this.log('Error handling verification passed', 'success');
    }
  }

  verifyIntegration() {
    this.log('Starting authentication integration verification...', 'info');

    // Run all verification checks
    this.verifyDependencies();
    this.verifyConfiguration();
    this.verifyBackendIntegration();
    this.verifyFrontendIntegration();
    this.verifySharedTypes();
    this.verifyRouteProtection();
    this.verifyErrorHandling();

    return this.generateReport();
  }

  generateReport() {
    this.log('Generating integration verification report...', 'info');

    const results = this.results;
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    const failedChecks = totalChecks - passedChecks;

    console.log('\n' + '='.repeat(60));
    console.log('AUTHENTICATION INTEGRATION VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log('');

    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const checkName = check.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${checkName}`);
    });

    if (this.issues.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('ISSUES FOUND:');
      console.log('-'.repeat(60));
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
      });
    }

    console.log('='.repeat(60));

    if (passedChecks === totalChecks) {
      this.log('All integration checks passed! 🎉', 'success');
      console.log('\nAuthentication system is properly integrated and ready for testing.');
      console.log('Next steps:');
      console.log('1. Start development server: pnpm dev');
      console.log('2. Test authentication flow manually');
      console.log('3. Run end-to-end tests with server running');
      return true;
    } else {
      this.log(`${failedChecks} integration check(s) failed`, 'error');
      console.log('\nPlease fix the issues above before proceeding with testing.');
      return false;
    }
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  const verifier = new AuthIntegrationVerifier();

  const success = verifier.verifyIntegration();
  process.exit(success ? 0 : 1);
}

module.exports = AuthIntegrationVerifier;
