/**
 * Generic Terminal Provider Processor
 * Generates JSON output for generic terminal information
 * Replaces jq usage in generic.sh
 */

import { createJsonOutput } from './json-utils.js';

interface GenericProviderInput {
  session_id?: string;
}

interface GenericProviderOutput {
  session_id: string;
  profile: string;
  tab_name: string;
  window_name: string;
}

/**
 * Create generic terminal provider JSON output
 * @param input - Terminal session data
 * @returns Compact JSON string
 */
export function createGenericProviderJson(input: GenericProviderInput): string {
  const output: GenericProviderOutput = {
    session_id: input.session_id !== undefined ? input.session_id : 'unknown',
    profile: 'unknown',
    tab_name: 'unknown',
    window_name: 'unknown'
  };

  return createJsonOutput(output);
}
