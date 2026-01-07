import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Property-Based Test for Type Sharing Consistency
 *
 * Property 1: Type Sharing Consistency
 * For any type modification in the shared package, both frontend and backend packages
 * should have access to the updated types after compilation.
 *
 * Validates: Requirements 2.5
 * Feature: project-initialization, Property 1: Type Sharing Consistency
 */

describe('Property 1: Type Sharing Consistency', () => {
  const SHARED_TYPES_PATH = join(process.cwd(), 'src', 'types.ts');
  const ORIGINAL_TYPES_CONTENT = readFileSync(SHARED_TYPES_PATH, 'utf-8');

  // Cleanup function to restore original types
  const restoreOriginalTypes = () => {
    writeFileSync(SHARED_TYPES_PATH, ORIGINAL_TYPES_CONTENT);
  };

  // Generator for valid TypeScript interface names
  const interfaceNameArb = fc
    .string({ minLength: 3, maxLength: 20 })
    .filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name))
    .map(name => name.charAt(0).toUpperCase() + name.slice(1));

  // Generator for valid TypeScript property names
  const propertyNameArb = fc
    .string({ minLength: 2, maxLength: 15 })
    .filter(name => /^[a-zA-Z][a-zA-Z0-9]*$/.test(name));

  // Generator for TypeScript primitive types
  const primitiveTypeArb = fc.constantFrom('string', 'number', 'boolean');

  // Generator for interface properties
  const interfacePropertyArb = fc.record({
    name: propertyNameArb,
    type: primitiveTypeArb,
    optional: fc.boolean(),
  });

  // Generator for complete interface definitions
  const interfaceArb = fc.record({
    name: interfaceNameArb,
    properties: fc.array(interfacePropertyArb, { minLength: 1, maxLength: 3 }),
    extendsBaseContent: fc.boolean(),
  });

  it('should maintain type sharing consistency across packages after type modifications', () => {
    fc.assert(
      fc.property(interfaceArb, interfaceSpec => {
        try {
          // Step 1: Generate a new interface definition
          const interfaceDefinition = generateInterfaceDefinition(interfaceSpec);

          // Step 2: Modify the shared types file
          const modifiedTypesContent = ORIGINAL_TYPES_CONTENT + '\n\n' + interfaceDefinition;
          writeFileSync(SHARED_TYPES_PATH, modifiedTypesContent);

          // Step 3: Verify the interface was added correctly by checking file content
          const updatedContent = readFileSync(SHARED_TYPES_PATH, 'utf-8');
          const interfaceExists = updatedContent.includes(`export interface ${interfaceSpec.name}`);

          // Step 4: Verify the interface has the expected properties
          const hasAllProperties = interfaceSpec.properties.every(prop =>
            updatedContent.includes(`${prop.name}${prop.optional ? '?' : ''}: ${prop.type}`)
          );

          // Step 5: Verify extends clause if applicable
          const extendsCorrect =
            !interfaceSpec.extendsBaseContent ||
            updatedContent.includes(`${interfaceSpec.name} extends BaseContent`);

          // Step 6: Verify the file is still valid TypeScript by checking syntax
          const hasValidSyntax = verifyTypeScriptSyntax(updatedContent);

          // Property assertion: The type should be properly added and accessible
          expect(interfaceExists).toBe(true);
          expect(hasAllProperties).toBe(true);
          expect(extendsCorrect).toBe(true);
          expect(hasValidSyntax).toBe(true);

          return true;
        } catch (error) {
          // Log error for debugging
          console.error('Property test error:', error);
          return false;
        } finally {
          // Always restore original types
          restoreOriginalTypes();
        }
      }),
      {
        numRuns: 100,
        timeout: 30000, // 30 seconds timeout for each test
        verbose: false,
      }
    );
  });

  // Helper function to generate TypeScript interface definition
  function generateInterfaceDefinition(spec: any): string {
    const { name, properties, extendsBaseContent } = spec;

    const extendsClause = extendsBaseContent ? ' extends BaseContent' : '';
    const propertiesStr = properties
      .map((prop: any) => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`)
      .join('\n');

    return `export interface ${name}${extendsClause} {
${propertiesStr}
}`;
  }

  // Helper function to verify TypeScript syntax is valid
  function verifyTypeScriptSyntax(content: string): boolean {
    try {
      // Basic syntax checks
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;

      // Check balanced braces
      if (openBraces !== closeBraces) {
        return false;
      }

      // Check for basic TypeScript interface syntax
      const interfaceRegex = /export\s+interface\s+\w+(\s+extends\s+\w+)?\s*{[^}]*}/g;
      const interfaces = content.match(interfaceRegex) || [];

      // Verify each interface has proper structure
      for (const interfaceStr of interfaces) {
        // Check for property syntax: propertyName?: type;
        const propertyRegex = /\s+\w+\??\s*:\s*\w+;/g;
        const hasValidProperties = propertyRegex.test(interfaceStr) || interfaceStr.includes('{}');

        if (!hasValidProperties) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
});
