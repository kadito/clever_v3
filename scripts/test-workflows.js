#!/usr/bin/env node

/**
 * Test script to validate CI/CD deployment workflows
 * This script simulates the workflow behavior and validates key requirements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class WorkflowTester {
  constructor() {
    this.results = {
      testWorkflow: { passed: 0, failed: 0, tests: [] },
      prodWorkflow: { passed: 0, failed: 0, tests: [] },
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m',
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  test(description, testFn, workflow) {
    try {
      testFn();
      this.results[workflow].passed++;
      this.results[workflow].tests.push({ description, status: 'PASSED' });
      this.log(`✅ ${description}`, 'success');
    } catch (error) {
      this.results[workflow].failed++;
      this.results[workflow].tests.push({ description, status: 'FAILED', error: error.message });
      this.log(`❌ ${description}: ${error.message}`, 'error');
    }
  }

  // Test workflow file structure and configuration
  testWorkflowStructure() {
    this.log('\n=== Testing Workflow Structure ===', 'info');

    // Test deploy-test.yml
    this.test(
      'deploy-test.yml exists',
      () => {
        if (!fs.existsSync('.github/workflows/deploy-test.yml')) {
          throw new Error('deploy-test.yml not found');
        }
      },
      'testWorkflow'
    );

    this.test(
      'deploy-test.yml has correct trigger',
      () => {
        const content = fs.readFileSync('.github/workflows/deploy-test.yml', 'utf8');
        const workflow = yaml.load(content);
        if (!workflow.on?.push?.branches?.includes('test')) {
          throw new Error('deploy-test.yml should trigger on test branch');
        }
      },
      'testWorkflow'
    );

    // Test deploy-prod.yml
    this.test(
      'deploy-prod.yml exists',
      () => {
        if (!fs.existsSync('.github/workflows/deploy-prod.yml')) {
          throw new Error('deploy-prod.yml not found');
        }
      },
      'prodWorkflow'
    );

    this.test(
      'deploy-prod.yml has correct trigger',
      () => {
        const content = fs.readFileSync('.github/workflows/deploy-prod.yml', 'utf8');
        const workflow = yaml.load(content);
        if (!workflow.on?.push?.branches?.includes('prod')) {
          throw new Error('deploy-prod.yml should trigger on prod branch');
        }
      },
      'prodWorkflow'
    );
  }

  // Test package build order
  testBuildOrder() {
    this.log('\n=== Testing Package Build Order ===', 'info');

    const testBuildSteps = (workflowFile, workflowType) => {
      const content = fs.readFileSync(workflowFile, 'utf8');
      const workflow = yaml.load(content);
      const steps = workflow.jobs.deploy.steps;

      const buildSteps = steps.filter(
        step => step.name?.includes('Build') || step.run?.includes('build')
      );

      // Check that shared builds first
      const sharedStep = buildSteps.find(step => step.run?.includes('@clever/shared build'));
      const frontendStep = buildSteps.find(step => step.run?.includes('@clever/frontend build'));
      const backendStep = buildSteps.find(step => step.run?.includes('@clever/backend build'));

      if (!sharedStep || !frontendStep || !backendStep) {
        throw new Error('Missing required build steps');
      }

      // Verify order by checking step indices
      const sharedIndex = steps.indexOf(sharedStep);
      const frontendIndex = steps.indexOf(frontendStep);
      const backendIndex = steps.indexOf(backendStep);

      if (sharedIndex >= frontendIndex || sharedIndex >= backendIndex) {
        throw new Error('@clever/shared must build before frontend and backend');
      }
    };

    this.test(
      'Test workflow has correct build order',
      () => {
        testBuildSteps('.github/workflows/deploy-test.yml', 'test');
      },
      'testWorkflow'
    );

    this.test(
      'Prod workflow has correct build order',
      () => {
        testBuildSteps('.github/workflows/deploy-prod.yml', 'prod');
      },
      'prodWorkflow'
    );
  }

  // Test environment-specific configuration
  testEnvironmentConfiguration() {
    this.log('\n=== Testing Environment Configuration ===', 'info');

    this.test(
      'Wrangler.toml has test environment config',
      () => {
        const content = fs.readFileSync('wrangler.toml', 'utf8');
        if (!content.includes('clever-dashboard-test')) {
          throw new Error('Test environment configuration missing');
        }
        if (!content.includes('clever-documents-test')) {
          throw new Error('Test R2 bucket configuration missing');
        }
      },
      'testWorkflow'
    );

    this.test(
      'Wrangler.toml has production environment config',
      () => {
        const content = fs.readFileSync('wrangler.toml', 'utf8');
        if (!content.includes('[env.production]')) {
          throw new Error('Production environment section missing');
        }
        if (!content.includes('clever-dashboard-prod')) {
          throw new Error('Production worker name missing');
        }
        if (!content.includes('clever-documents-prod')) {
          throw new Error('Production R2 bucket configuration missing');
        }
      },
      'prodWorkflow'
    );

    this.test(
      'Production workflow uses --env production flag',
      () => {
        const content = fs.readFileSync('.github/workflows/deploy-prod.yml', 'utf8');
        if (!content.includes('--env production')) {
          throw new Error('Production workflow should use --env production flag');
        }
      },
      'prodWorkflow'
    );
  }

  // Test security configuration
  testSecurityConfiguration() {
    this.log('\n=== Testing Security Configuration ===', 'info');

    const testSecretsUsage = (workflowFile, workflowType) => {
      const content = fs.readFileSync(workflowFile, 'utf8');
      if (!content.includes('CLOUDFLARE_API_TOKEN')) {
        throw new Error('CLOUDFLARE_API_TOKEN secret not used');
      }
      if (!content.includes('CLOUDFLARE_ACCOUNT_ID')) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID secret not used');
      }
      if (!content.includes('secrets.')) {
        throw new Error('Secrets not properly referenced');
      }
    };

    this.test(
      'Test workflow uses required secrets',
      () => {
        testSecretsUsage('.github/workflows/deploy-test.yml', 'test');
      },
      'testWorkflow'
    );

    this.test(
      'Prod workflow uses required secrets',
      () => {
        testSecretsUsage('.github/workflows/deploy-prod.yml', 'prod');
      },
      'prodWorkflow'
    );
  }

  // Test error handling
  testErrorHandling() {
    this.log('\n=== Testing Error Handling ===', 'info');

    const testErrorHandling = (workflowFile, workflowType) => {
      const content = fs.readFileSync(workflowFile, 'utf8');
      const workflow = yaml.load(content);
      const steps = workflow.jobs.deploy.steps;

      const hasFailureHandling = steps.some(
        step => step.if === 'failure()' || step.run?.includes('exit 1')
      );

      if (!hasFailureHandling) {
        throw new Error('No failure handling found in workflow');
      }
    };

    this.test(
      'Test workflow has error handling',
      () => {
        testErrorHandling('.github/workflows/deploy-test.yml', 'test');
      },
      'testWorkflow'
    );

    this.test(
      'Prod workflow has error handling',
      () => {
        testErrorHandling('.github/workflows/deploy-prod.yml', 'prod');
      },
      'prodWorkflow'
    );
  }

  // Test actual build process
  testBuildProcess() {
    this.log('\n=== Testing Build Process ===', 'info');

    this.test(
      'Dependencies install successfully',
      () => {
        try {
          execSync('pnpm install --frozen-lockfile', { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Dependency installation failed: ${error.message}`);
        }
      },
      'testWorkflow'
    );

    this.test(
      'Shared package builds successfully',
      () => {
        try {
          execSync('pnpm --filter @clever/shared build', { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Shared package build failed: ${error.message}`);
        }
      },
      'testWorkflow'
    );

    this.test(
      'Frontend package builds successfully',
      () => {
        try {
          execSync('pnpm --filter @clever/frontend build', { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Frontend package build failed: ${error.message}`);
        }
      },
      'testWorkflow'
    );

    this.test(
      'Backend package builds successfully',
      () => {
        try {
          execSync('pnpm --filter @clever/backend build', { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Backend package build failed: ${error.message}`);
        }
      },
      'testWorkflow'
    );
  }

  // Test deployment verification
  testDeploymentVerification() {
    this.log('\n=== Testing Deployment Verification ===', 'info');

    const testVerificationSteps = (workflowFile, workflowType) => {
      const content = fs.readFileSync(workflowFile, 'utf8');
      const workflow = yaml.load(content);
      const steps = workflow.jobs.deploy.steps;

      const hasVerification = steps.some(
        step => step.name?.includes('Verify') || step.run?.includes('deployment')
      );

      if (!hasVerification) {
        throw new Error('No deployment verification found');
      }
    };

    this.test(
      'Test workflow has deployment verification',
      () => {
        testVerificationSteps('.github/workflows/deploy-test.yml', 'test');
      },
      'testWorkflow'
    );

    this.test(
      'Prod workflow has deployment verification',
      () => {
        testVerificationSteps('.github/workflows/deploy-prod.yml', 'prod');
      },
      'prodWorkflow'
    );
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting CI/CD Workflow Validation Tests', 'info');

    this.testWorkflowStructure();
    this.testBuildOrder();
    this.testEnvironmentConfiguration();
    this.testSecurityConfiguration();
    this.testErrorHandling();
    this.testBuildProcess();
    this.testDeploymentVerification();

    this.printResults();
  }

  printResults() {
    this.log('\n=== Test Results Summary ===', 'info');

    const testTotal = this.results.testWorkflow.passed + this.results.testWorkflow.failed;
    const prodTotal = this.results.prodWorkflow.passed + this.results.prodWorkflow.failed;

    this.log(
      `\nTest Workflow: ${this.results.testWorkflow.passed}/${testTotal} tests passed`,
      this.results.testWorkflow.failed === 0 ? 'success' : 'warning'
    );

    this.log(
      `Production Workflow: ${this.results.prodWorkflow.passed}/${prodTotal} tests passed`,
      this.results.prodWorkflow.failed === 0 ? 'success' : 'warning'
    );

    // Print failed tests
    if (this.results.testWorkflow.failed > 0) {
      this.log('\nFailed Test Workflow Tests:', 'error');
      this.results.testWorkflow.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => this.log(`  - ${test.description}: ${test.error}`, 'error'));
    }

    if (this.results.prodWorkflow.failed > 0) {
      this.log('\nFailed Production Workflow Tests:', 'error');
      this.results.prodWorkflow.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => this.log(`  - ${test.description}: ${test.error}`, 'error'));
    }

    const totalFailed = this.results.testWorkflow.failed + this.results.prodWorkflow.failed;
    if (totalFailed === 0) {
      this.log('\n🎉 All workflow validation tests passed!', 'success');
      this.log('Both deploy-test and deploy-prod workflows are properly configured.', 'success');
    } else {
      this.log(`\n⚠️  ${totalFailed} tests failed. Please review the issues above.`, 'warning');
    }
  }
}

// Run the tests
const tester = new WorkflowTester();
tester.runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
