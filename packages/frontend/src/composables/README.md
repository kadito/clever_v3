# Authentication Composables

## useAuth

The `useAuth` composable provides authentication state management using Clerk and shared UserContext types.

### Usage

```typescript
import { useAuth } from '@/composables/useAuth';

export default {
  setup() {
    const {
      isLoaded,
      isSignedIn,
      user,
      isAuthenticated,
      userType,
      userName,
      signOut
    } = useAuth();

    return {
      isLoaded,
      isSignedIn,
      user,
      isAuthenticated,
      userType,
      userName,
      signOut
    };
  }
};
```

### Properties

- `isLoaded`: Boolean indicating if Clerk has finished loading
- `isSignedIn`: Boolean indicating if user is signed in
- `user`: UserContext object with user information (null if not signed in)
- `isAuthenticated`: Boolean combining sign-in status and user authentication
- `userType`: User type ('Admin' | 'User' | null)
- `userName`: Formatted user name (firstName lastName or email)

### Methods

- `signOut()`: Signs out the user and clears authentication state

### Requirements

This composable satisfies requirements:
- 4.2: Authentication state management
- 4.3: User information storage in application state