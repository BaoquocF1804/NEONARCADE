# Walkthrough - Fixing Registration/Login Error

I have improved the error handling in `src/services/api.ts` to catch cases where the server returns a non-JSON response (like an HTML error page or empty body), which was causing the "Unexpected end of JSON input" error.

## Changes

### Improved API Error Handling

I updated `src/services/api.ts` to check the `Content-Type` header before parsing the response as JSON.

#### `src/services/api.ts`

```typescript
// Before
const data = await response.json();

// After
let data;
const contentType = response.headers.get("content-type");
if (contentType && contentType.indexOf("application/json") !== -1) {
    data = await response.json();
} else {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error('Server returned non-JSON response. Check console for details.');
}
```

This change applies to both `register` and `login` functions.

## Verification Results

### Automated Tests
- This change is defensive coding. It ensures that if the server fails (e.g. 500 error with HTML body), the client will log the actual error text instead of crashing with a JSON parse error.

### Manual Verification
- The user should now see a more descriptive error message in the console if the server fails, which will help in debugging the underlying server issue if it persists.
