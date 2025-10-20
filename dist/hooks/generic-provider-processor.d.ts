/**
 * Generic Terminal Provider Processor
 * Generates JSON output for generic terminal information
 * Replaces jq usage in generic.sh
 */
interface GenericProviderInput {
    session_id?: string;
}
/**
 * Create generic terminal provider JSON output
 * @param input - Terminal session data
 * @returns Compact JSON string
 */
export declare function createGenericProviderJson(input: GenericProviderInput): string;
export {};
//# sourceMappingURL=generic-provider-processor.d.ts.map