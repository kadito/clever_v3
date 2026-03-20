---
inclusion: fileMatch
fileMatchPattern: ["packages/frontend/**/*.vue", "packages/frontend/**/*.ts"]
---

# Frontend Logging Standards

## Vue Client-Side Logging

All logging on the client side (Vue components, composables, stores) must use
JSON.stringify for nested objects to ensure complete object visibility during
debugging and troubleshooting.

### Required Patterns

**✅ Correct - Use JSON.stringify for objects:**

```javascript
// For nested objects, arrays, or complex data structures
console.log('User data:', JSON.stringify(userData, null, 2));
console.log('API response:', JSON.stringify(response, null, 2));
console.log('Form state:', JSON.stringify(formData, null, 2));
console.log('Relation data:', JSON.stringify(relations, null, 2));
console.error('Error details:', JSON.stringify(error, null, 2));
```

**❌ Incorrect - Direct object logging:**

```javascript
// These don't show nested object values properly
console.log('User data:', userData);
console.log('API response:', response);
console.log('Form state:', formData);
```

### When to Use JSON.stringify

- **Always** for objects with nested properties
- **Always** for arrays containing objects
- **Always** for API responses and request payloads
- **Always** for form data and validation errors
- **Always** for store state changes
- **Always** for relation resolution results
- **Always** for error objects with nested properties

### When Simple Logging is OK

- Primitive values (strings, numbers, booleans)
- Simple messages without object data
- Performance-critical paths (use sparingly)

### Examples by Context

**Component Data:**

```javascript
// In Vue components
console.log('Component props:', JSON.stringify(props, null, 2));
console.log('Reactive data:', JSON.stringify(toRaw(reactiveData), null, 2));
```

**API Calls:**

```javascript
// In composables or services
console.log('API request:', JSON.stringify({ url, method, body }, null, 2));
console.log('API response:', JSON.stringify(response, null, 2));
console.error('API error:', JSON.stringify(error, null, 2));
```

**Store Operations:**

```javascript
// In Pinia stores
console.log('Store state update:', JSON.stringify(this.$state, null, 2));
console.log('Action payload:', JSON.stringify(payload, null, 2));
```

**Relation Handling:**

```javascript
// When working with content relations
console.log('Resolved relations:', JSON.stringify(relations, null, 2));
console.log('Relation errors:', JSON.stringify(relationErrors, null, 2));
```

### Performance Considerations

- Use JSON.stringify(obj, null, 2) for readable formatting during development
- Consider removing or reducing logging in production builds
- For very large objects, consider logging specific properties:
  ```javascript
  console.log(
    'Large object subset:',
    JSON.stringify(
      {
        id: obj.id,
        status: obj.status,
        // only relevant fields
      },
      null,
      2
    )
  );
  ```

### Error Logging

Always stringify error objects to capture all error properties:

```javascript
try {
  // some operation
} catch (error) {
  console.error(
    'Operation failed:',
    JSON.stringify(
      {
        message: error.message,
        stack: error.stack,
        context: contextData,
      },
      null,
      2
    )
  );
}
```

## Rationale

This standard ensures that when debugging issues or providing logs for
troubleshooting:

1. All nested object values are visible
2. Object structure is clear and readable
3. No information is lost due to console.log's object reference behavior
4. Debugging sessions are more efficient and effective
5. Remote troubleshooting is possible with complete object data

## Enforcement

- All new Vue code must follow this standard
- Code reviews should check for proper object logging
- Existing code should be updated when modified
- Use ESLint rules where possible to enforce this pattern
