#!/usr/bin/env node
/**
 * CLI Entry Point for Hook Processors
 * Replaces jq in shell hook scripts
 *
 * Usage:
 *   echo "$DATA" | node cli.js --operation=<operation> [--arg=value ...]
 *
 * Operations:
 *   - parse-hook-input: Parse Claude hook JSON from stdin
 *   - create-git-info: Create git info JSON
 *   - create-generic-provider: Create generic provider JSON
 *   - create-activity-event: Create activity event JSON
 *   - create-session-event: Create session event JSON
 *   - extract-field: Extract a single field from JSON
 */

import * as fs from 'fs';
import { parseHookInput, createSessionEventJson } from './session-processor.js';
import { createGitInfoJson } from './git-info-processor.js';
import { createGenericProviderJson } from './generic-provider-processor.js';
import { createActivityEventJson } from './activity-processor.js';
import { parseJsonInput, extractField } from './json-utils.js';

/**
 * Read stdin synchronously
 */
function readStdin(): string {
  return fs.readFileSync(0, 'utf-8');
}

/**
 * Parse command line arguments
 */
function parseArgs(): Map<string, string> {
  const args = new Map<string, string>();

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args.set(key, value || 'true');
    }
  }

  return args;
}

/**
 * Main CLI function
 */
function main() {
  try {
    const args = parseArgs();
    const operation = args.get('operation');

    if (!operation) {
      console.error('Error: --operation argument is required');
      process.exit(1);
    }

    const input = readStdin();
    let output: string;

    switch (operation) {
      case 'parse-hook-input': {
        const result = parseHookInput(input);
        output = JSON.stringify(result);
        break;
      }

      case 'create-git-info': {
        const data = JSON.parse(input);
        output = createGitInfoJson(data);
        break;
      }

      case 'create-generic-provider': {
        const data = JSON.parse(input);
        output = createGenericProviderJson(data);
        break;
      }

      case 'create-activity-event': {
        const data = JSON.parse(input);
        output = createActivityEventJson(data);
        break;
      }

      case 'create-session-event': {
        const data = JSON.parse(input);
        output = createSessionEventJson(data);
        break;
      }

      case 'extract-field': {
        const field = args.get('field');
        const defaultValue = args.get('default') || 'unknown';

        if (!field) {
          console.error('Error: --field argument is required for extract-field operation');
          process.exit(1);
        }

        const data = parseJsonInput(input);
        output = String(extractField(data, field, defaultValue));
        break;
      }

      default:
        console.error(`Error: Unknown operation "${operation}"`);
        process.exit(1);
    }

    console.log(output);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
