#!/usr/bin/env node

/**
 * Authentication Integration Test Script
 *
 * This script tests the complete authentication integration by:
 * 1. Building the application
 * 2. Starting the development server
 * 3. Running integration tests
 * 4. Cleaning up
 *
 * Requirements: All requirements integration
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class AuthIntegrationTester {
  constructor() {
    this.devProcess = null;
    this.testResults = {
      build: false,
      server: false,
      backendTests: false,
      frontendTests: false,
      e2eTests: false,
    };
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

  async runCommand(command, cwd = process.cwd()) {
    this.log(`Running: ${command}`, 'info');

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stderr && !stderr.includes('warning')) {
        this.log(`Command stderr: ${stderr}`, 'warning');
      }
      return { success: true, stdout, stderr };
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async buildApplication() {
    this.log('Building application...', 'info');

    const result = await this.runCommand('pnpm build');
    this.testResults.build = result.success;

    if (result.success) {
      this.log('Build completed successfully', 'success');
    } else {
      this.log('Build failed', 'error');
    }

    return result.success;
  }

  async startDevServer() {
    this.log('Starting development server...', 'info');

    return new Promise(resolve => {
      this.devProcess = spawn('pnpm', ['dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let serverReady = false;
      let output = '';

      this.devProcess.stdout.on('data', data => {
        output += data.toString();
        if (output.includes('Ready on') || output.includes('localhost:8787')) {
          if (!serverReady) {
            serverReady = true;
            this.testResults.server = true;
            this.log('Development server started successfully', 'success');
            resolve(true);
          }
        }
      });

      this.devProcess.stderr.on('data', data => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          this.log(`Server error: ${error}`, 'error');
        }
      });

      this.devProcess.on('close', code => {
        if (!serverReady) {
          this.log(`Server process exited with code ${code}`, 'error');
          resolve(false);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          this.log('Server startup timeout', 'error');
          resolve(false);
        }
      }, 30000);
    });
  }

  async waitForServer() {
    this.log('Waiting for server to be ready...', 'info');

    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch('http://localhost:8787/health');
        if (response.ok) {
          this.log('Server is ready', 'success');
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      await sleep(1000);
    }

    this.log('Server failed to become ready', 'error');
    return false;
  }

  async runBackendTests() {
    this.log('Running backend integration tests...', 'info');

    const result = await this.runCommand(
      'pnpm --filter @clever/backend test auth-integration-e2e.test.ts --run',
      process.cwd()
    );

    this.testResults.backendTests = result.success;

    if (result.success) {
      this.log('Backend tests passed', 'success');
    } else {
      this.log('Backend tests failed', 'error');
    }

    return result.success;
  }

  async runFrontendTests() {
    this.log('Running frontend integration tests...', 'info');

    const result = await this.runCommand(
      'pnpm --filter @clever/frontend test auth-integration.test.ts --run',
      process.cwd()
    );

    this.testResults.frontendTests = result.success;

    if (result.success) {
      this.log('Frontend tests passed', 'success');
    } else {
      this.log('Frontend tests failed', 'error');
    }

    return result.success;
  }

  async runE2ETests() {
    this.log('Running end-to-end integration tests...', 'info');

    const result = await this.runCommand(
      'pnpm --filter @clever/backend test integration.test.ts --run',
      process.cwd()
    );

    this.testResults.e2eTests = result.success;

    if (result.success) {
      this.log('E2E tests passed', 'success');
    } else {
      this.log('E2E tests failed', 'error');
    }

    return result.success;
  }

  async cleanup() {
    this.log('Cleaning up...', 'info');

    if (this.devProcess) {
      this.devProcess.kill('SIGTERM');
      await sleep(2000);
      if (!this.devProcess.killed) {
        this.devProcess.kill('SIGKILL');
      }
      this.devProcess = null;
    }

    this.log('Cleanup completed', 'success');
  }

  async runIntegrationTests() {
    this.log('Starting authentication integration tests...', 'info');

    try {
      // Step 1: Build application
      const buildSuccess = await this.buildApplication();
      if (!buildSuccess) {
        this.log('Skipping server tests due to build failure', 'warning');
      }

      // Step 2: Start development server
      const serverSuccess = await this.startDevServer();
      if (!serverSuccess) {
        this.log('Failed to start development server', 'error');
        return this.generateReport();
      }

      // Step 3: Wait for server to be ready
      const serverReady = await this.waitForServer();
      if (!serverReady) {
        this.log('Server not ready for testing', 'error');
        return this.generateReport();
      }

      // Step 4: Run backend integration tests
      await this.runBackendTests();

      // Step 5: Run frontend integration tests (can run without server)
      await this.runFrontendTests();

      // Step 6: Run E2E tests
      await this.runE2ETests();

      return this.generateReport();
    } catch (error) {
      this.log(`Integration test failed: ${error.message}`, 'error');
      return this.generateReport();
    } finally {
      await this.cleanup();
    }
  }

  generateReport() {
    this.log('Generating integration test report...', 'info');

    const results = this.testResults;
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    console.log('\n' + '='.repeat(60));
    console.log('AUTHENTICATION INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log('');

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${testName}`);
    });

    console.log('='.repeat(60));

    if (passedTests === totalTests) {
      this.log('All integration tests passed! 🎉', 'success');
      return true;
    } else {
      this.log(`${failedTests} integration test(s) failed`, 'error');
      return false;
    }
  }
}

// Run the integration tests if this script is executed directly
if (require.main === module) {
  const tester = new AuthIntegrationTester();

  tester
    .runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Integration test runner failed:', error);
      process.exit(1);
    });
}

module.exports = AuthIntegrationTester;
