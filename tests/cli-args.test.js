import { describe, test, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Arguments', () => {
  const cliPath = path.join(__dirname, '../mcp/dist/cli.cjs');

  test('should parse --cloud-mode argument', () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, '--cloud-mode'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(output).toContain('Starting CloudBase MCP Server in cloud mode');
        resolve();
      });

      // Send SIGTERM after a short delay to terminate the process
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 1000);
    });
  });

  test('should parse --integration-ide argument', () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, '--integration-ide', 'test-ide'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(output).toContain('Integration IDE: test-ide');
        resolve();
      });

      // Send SIGTERM after a short delay to terminate the process
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 1000);
    });
  });

  test('should parse --integration-ide=value argument', () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, '--integration-ide=test-ide-equals'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(output).toContain('Integration IDE: test-ide-equals');
        resolve();
      });

      // Send SIGTERM after a short delay to terminate the process
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 1000);
    });
  });

  test('should parse both --cloud-mode and --integration-ide arguments', () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, '--cloud-mode', '--integration-ide', 'test-ide'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        expect(output).toContain('Starting CloudBase MCP Server in cloud mode');
        expect(output).toContain('Integration IDE: test-ide');
        resolve();
      });

      // Send SIGTERM after a short delay to terminate the process
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 1000);
    });
  });
});
