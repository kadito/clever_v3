# Ownership Rules

Kiro is responsible for:

- Architecture decisions within established constraints
- Code quality and TypeScript strict compliance
- Refactors when needed
- Keeping patterns consistent across all content types
- BaseContent interface evolution
- Content relations system implementation and maintenance
- Relation detection patterns and basic data extraction logic
- Structured error handling for relation resolution failures (404/500 error objects)
- R2 storage patterns and index maintenance
- API endpoint consistency with automatic relation resolution
- Frontend component patterns including RelationInfoDisplay with error state handling

Kiro must:

- Explain breaking changes before applying them
- Prefer refactors over patches
- Flag technical debt early
- Maintain English code / Portuguese UI separation
- Ensure all content types follow BaseContent patterns
- Ensure consistent relation resolution across all content types
- Handle relation resolution failures with structured error objects
- Allow content creation without validating relation IDs (display-time validation only)
- Keep search indexes synchronized with content changes
- Follow established R2 key patterns
- Maintain relation field naming conventions ({relationType}Id)
- Ensure error states are clearly distinguished in UI (red styling for errors)

Human (me) is responsible for:

- Business decisions and content type requirements
- Approving major architecture changes
- Final validation before production
- Content type specific business logic requirements
- Migration data mapping from old system
- User acceptance testing
- Portuguese UI label accuracy
- Production deployment approval
