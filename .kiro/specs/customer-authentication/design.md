# Customer Authentication Feature Design

## Overview

The customer authentication system provides secure user registration, login, and profile management for the food ordering application. The system follows a progressive disclosure pattern: users are prompted to authenticate only when attempting to checkout, then guided through a two-step registration process that collects essential information first (name, phone, password) followed by optional hostel details. The design leverages React Context for state management, IndexedDB for session persistence, and follows the existing architectural patterns established in the CartContext.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Popup  │  │Profile Badge │  │Profile Page  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Context Layer                           │
│              ┌──────────────────────────┐                    │
│              │   AuthContext Provider   │                    │
│              │  - User State            │                    │
│              │  - Auth Operations       │                    │
│              │  - Session Management    │                    │
│              └──────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Auth Service  │  │User Storage  │  │Order Service │      │
│  │- Login       │  │- IndexedDB   │  │- History     │      │
│  │- Register    │  │- Memory      │  │- Retrieval   │      │
│  │- Validate    │  │  Fallback    │  └──────────────┘      │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App Layout
├── AuthProvider (Context)
│   ├── ProfileBadge (Top Right)
│   │   └── User Initials Display
│   ├── CartSidebar
│   │   └── Checkout Button → triggers LoginPopup
│   ├── LoginPopup (Modal)
│   │   ├── LoginForm
│   │   └── SignupForm
│   │       ├── Step 1: Basic Info (name, phone, password)
│   │       └── Step 2: Hostel Details (optional)
│   └── ProfilePage (Route: /profile)
│       ├── User Details Section
│       ├── Order History Section
│       └── Logout Button
```

## Components and Interfaces

### 1. AuthContext

The central state management for authentication, following the pattern established by CartContext.

```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  hostelDetails?: {
    block?: string;
    floor?: string;
    room?: string;
    year?: string;
    department?: string;
  };
  createdAt: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  requireAuth: () => Promise<boolean>; // Returns true if authenticated, shows popup if not
}
```

### 2. LoginPopup Component

Modal dialog that displays authentication forms.

```typescript
interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Internal state
type AuthMode = 'login' | 'signup-basic' | 'signup-details';
```

**Behavior:**
- Displays as a modal overlay with backdrop
- Switches between login and signup modes
- Two-step signup: basic info → optional hostel details
- Validates inputs before submission
- Shows error messages inline
- Closes on successful authentication

### 3. ProfileBadge Component

Visual indicator of authentication status in the top-right corner.

```typescript
interface ProfileBadgeProps {
  user: User;
  onClick: () => void;
}
```

**Behavior:**
- Displays user initials (first letter of first and last name)
- Circular badge with colored background
- Clickable to navigate to profile page
- Only visible when user is authenticated

### 4. ProfilePage Component

Full page displaying user information and order history.

```typescript
interface ProfilePageProps {
  // Uses AuthContext internally
}
```

**Sections:**
- User details (name, phone, hostel info)
- Edit profile button
- Order history list
- Logout button

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID
  name: string;                  // Full name
  phone: string;                 // Unique identifier for login
  passwordHash: string;          // Hashed password (not exposed in context)
  hostelDetails?: {
    block?: string;              // Hostel block name
    floor?: string;              // Floor number
    room?: string;               // Room number
    year?: string;               // Academic year
    department?: string;         // Department name
  };
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}
```

### Order Model

```typescript
interface Order {
  id: string;                    // UUID
  userId: string;                // References User.id
  items: CartItem[];             // Snapshot of cart items
  selectedBlock: HostelBlock;    // Delivery location
  selectedSlot: string;          // Delivery time
  totalAmount: number;           // Total price
  status: OrderStatus;           // Order status
  createdAt: number;             // Timestamp
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
```

### Storage Schema

**IndexedDB Structure:**
```
Database: pkchai-db
├── Object Store: users
│   ├── keyPath: phone
│   └── indexes: id
├── Object Store: auth-session
│   └── keyPath: id (single record: 'current-session')
└── Object Store: orders
    ├── keyPath: id
    └── indexes: userId, createdAt
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Checkout requires authentication
*For any* cart state, attempting to proceed to checkout should only succeed when a user is authenticated, and should display the login popup when not authenticated.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Valid registration creates account
*For any* valid registration data (non-empty name, unique phone, non-empty password), submitting the registration form should create a new user account with the provided information.
**Validates: Requirements 2.2**

### Property 3: Required fields validation
*For any* registration attempt with empty name, phone, or password fields, the system should reject the registration and display appropriate validation errors.
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 4: Phone number uniqueness
*For any* existing user, attempting to register a new account with the same phone number should be rejected with an error message.
**Validates: Requirements 2.6**

### Property 5: Skip hostel details completes registration
*For any* user who completes basic registration and clicks skip on the hostel details form, the user account should be created without hostel details.
**Validates: Requirements 3.3**

### Property 6: Hostel details persistence
*For any* hostel details provided during registration (complete or partial), the system should save exactly the fields that were filled in to the user profile.
**Validates: Requirements 3.4, 3.5**

### Property 7: Valid credentials authenticate user
*For any* registered user, logging in with their correct phone number and password should authenticate the user and create a session.
**Validates: Requirements 4.1**

### Property 8: Invalid credentials rejected
*For any* login attempt with incorrect phone number or password, the system should reject the login and display an error message.
**Validates: Requirements 4.2**

### Property 9: Session persistence
*For any* authenticated user, the session should persist across page refreshes and subsequent visits until logout.
**Validates: Requirements 4.3, 4.4**

### Property 10: Profile indicator visibility
*For any* authentication state, the profile indicator should be visible if and only if a user is authenticated.
**Validates: Requirements 5.1, 5.3**

### Property 11: Initials calculation
*For any* user name, the profile indicator should display initials derived from the first letter of the first and last name (or first letter only if single name).
**Validates: Requirements 5.2**

### Property 12: Profile page displays user data
*For any* authenticated user, the profile page should display their name, phone number, and hostel details (if provided).
**Validates: Requirements 6.2**

### Property 13: Order history chronological ordering
*For any* user with multiple orders, the order history should display orders in reverse chronological order (newest first).
**Validates: Requirements 6.3**

### Property 14: Order history completeness
*For any* order in the history, all relevant details (date, items, total amount) should be displayed.
**Validates: Requirements 6.4**

### Property 15: Logout clears session
*For any* authenticated user, clicking logout should clear the session from storage and mark the user as unauthenticated.
**Validates: Requirements 7.2, 7.4**

### Property 16: Logout updates UI
*For any* authenticated user, clicking logout should remove the profile indicator from the page.
**Validates: Requirements 7.3**

### Property 17: Name update propagation
*For any* authenticated user, updating their name should save the new name to storage and update the profile indicator initials.
**Validates: Requirements 8.2**

### Property 18: Hostel details update
*For any* authenticated user, updating their hostel details should save the new information to the user profile.
**Validates: Requirements 8.3**

### Property 19: Phone update uniqueness constraint
*For any* authenticated user, attempting to update their phone number to one that already exists should be rejected with an error message.
**Validates: Requirements 8.4**

## Error Handling

### Validation Errors

**Input Validation:**
- Empty required fields (name, phone, password)
- Invalid phone number format (non-numeric, wrong length)
- Weak password (minimum 6 characters)
- Duplicate phone number on registration or update

**Error Display:**
- Inline error messages below form fields
- Red border on invalid fields
- Clear, user-friendly error text
- Errors clear when user corrects input

### Authentication Errors

**Login Failures:**
- Invalid credentials: "Phone number or password is incorrect"
- Account not found: "No account found with this phone number"
- Network errors: "Unable to connect. Please try again."

**Session Errors:**
- Expired session: Automatically show login popup
- Corrupted session data: Clear and prompt re-login
- Storage unavailable: Use memory fallback, warn user

### Storage Errors

**IndexedDB Failures:**
- Graceful fallback to memory storage
- Display warning: "Changes may not persist across sessions"
- Continue functionality without blocking user

**Data Corruption:**
- Validate data structure on load
- Clear corrupted data and start fresh
- Log errors for debugging

## Testing Strategy

### Unit Testing

The authentication system will use **Vitest** (already configured in the project) for unit testing.

**Unit Test Coverage:**
- Input validation functions (phone format, password strength, required fields)
- Initials calculation from names
- Password hashing and verification
- Session serialization/deserialization
- Storage adapter methods (save, load, clear)
- Error message generation

**Example Unit Tests:**
```typescript
describe('validatePhone', () => {
  it('accepts valid 10-digit phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
  });
  
  it('rejects phone numbers with letters', () => {
    expect(validatePhone('98765abc10')).toBe(false);
  });
});

describe('getInitials', () => {
  it('extracts first and last name initials', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });
  
  it('handles single names', () => {
    expect(getInitials('Madonna')).toBe('M');
  });
});
```

### Property-Based Testing

The authentication system will use **fast-check** for property-based testing in TypeScript/JavaScript.

**Installation:**
```bash
npm install --save-dev fast-check
```

**Property Test Requirements:**
- Each property-based test MUST run a minimum of 100 iterations
- Each test MUST include a comment tag referencing the design document property
- Tag format: `// Feature: customer-authentication, Property X: [property text]`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Test Coverage:**
- Registration with valid random data creates accounts (Property 2)
- Required field validation rejects empty inputs (Property 3)
- Phone uniqueness prevents duplicate registrations (Property 4)
- Login with valid credentials succeeds (Property 7)
- Login with invalid credentials fails (Property 8)
- Session persistence across storage operations (Property 9)
- Initials calculation for random names (Property 11)
- Order history sorting for random order sets (Property 13)
- Profile updates propagate correctly (Property 17, 18)

**Example Property Test:**
```typescript
import fc from 'fast-check';

// Feature: customer-authentication, Property 2: Valid registration creates account
describe('Property: Valid registration creates account', () => {
  it('creates account for any valid registration data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // name
        fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d+$/.test(s)), // phone
        fc.string({ minLength: 6 }) // password
      ),
      async (name, phone, password) => {
        const result = await register({ name, phone, password });
        expect(result.success).toBe(true);
        expect(result.user.name).toBe(name);
        expect(result.user.phone).toBe(phone);
      }
    ),
    { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Component Integration:**
- LoginPopup with AuthContext
- ProfileBadge with AuthContext
- ProfilePage with AuthContext and order service
- Checkout flow with authentication requirement

**Storage Integration:**
- IndexedDB adapter with real browser APIs
- Memory fallback when IndexedDB unavailable
- Session persistence across page reloads

### Test Data Generators

**For Property-Based Tests:**
```typescript
// User data generator
const userArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d+$/.test(s)),
  password: fc.string({ minLength: 6, maxLength: 50 })
});

// Hostel details generator
const hostelDetailsArb = fc.record({
  block: fc.option(fc.constantFrom('A', 'B', 'C', 'D')),
  floor: fc.option(fc.integer({ min: 1, max: 10 }).map(String)),
  room: fc.option(fc.integer({ min: 1, max: 50 }).map(String)),
  year: fc.option(fc.constantFrom('1', '2', '3', '4')),
  department: fc.option(fc.constantFrom('CSE', 'ECE', 'ME', 'CE'))
});

// Order generator
const orderArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  items: fc.array(cartItemArb, { minLength: 1 }),
  totalAmount: fc.integer({ min: 1, max: 10000 }),
  createdAt: fc.integer({ min: 1600000000000, max: Date.now() })
});
```

## Security Considerations

### Password Security

**Hashing:**
- Use Web Crypto API's SubtleCrypto for password hashing
- PBKDF2 with SHA-256, 100,000 iterations
- Generate random salt per user
- Store salt alongside hash

**Implementation:**
```typescript
async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  return arrayBufferToBase64(hash);
}
```

### Session Security

**Session Management:**
- Generate cryptographically random session IDs
- Store session ID in IndexedDB (not localStorage for XSS protection)
- Implement session timeout (7 days default)
- Clear session on logout

**Session Validation:**
- Verify session exists and is not expired on each auth check
- Regenerate session ID on login to prevent fixation attacks

### Data Privacy

**Client-Side Storage:**
- All user data stored in IndexedDB (origin-isolated)
- No sensitive data in URLs or localStorage
- Clear all data on logout

**Future Backend Integration:**
- Design allows easy migration to backend authentication
- Phone numbers can be used as unique identifiers
- Password hashes ready for server-side verification

## Implementation Notes

### Progressive Enhancement

**Two-Step Registration:**
1. Collect essential info first (name, phone, password)
2. Create account immediately after step 1
3. Show optional hostel details form
4. Allow skip to complete registration
5. Save hostel details if provided

**Benefits:**
- Reduces friction for users who want to skip details
- Ensures account is created even if user abandons step 2
- Provides clear progress indication

### State Management Pattern

**Following CartContext Pattern:**
- Use React Context for global auth state
- Implement useAuth hook for component access
- Debounce storage operations to batch updates
- Handle loading states during initialization
- Provide memory fallback for storage failures

### UI/UX Considerations

**Login Popup:**
- Modal overlay with backdrop
- Escape key to close (if not required for checkout)
- Focus trap within modal
- Clear visual distinction between login and signup

**Profile Badge:**
- Circular design matching app aesthetic
- Colored background (can use hash of user ID for consistent color)
- White text for initials
- Hover effect to indicate clickability
- Position: top-right corner, consistent with common patterns

**Profile Page:**
- Clean layout with sections
- Edit mode toggle for profile information
- Order history with pagination (if many orders)
- Responsive design for mobile

### Accessibility

**Keyboard Navigation:**
- Tab order through form fields
- Enter to submit forms
- Escape to close modals
- Focus management on modal open/close

**Screen Readers:**
- Proper ARIA labels on form fields
- Error announcements via aria-live
- Button labels for icon-only elements
- Semantic HTML structure

**Visual:**
- Sufficient color contrast (WCAG AA)
- Error states not relying solely on color
- Focus indicators on interactive elements
- Readable font sizes

## Future Enhancements

### Backend Integration

**API Endpoints:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- PUT /api/auth/profile
- GET /api/orders/history

**Migration Path:**
- Replace IndexedDB storage with API calls
- Keep same interface in AuthContext
- Add JWT token management
- Implement refresh token flow

### Additional Features

**Password Reset:**
- OTP via SMS to phone number
- Temporary password generation
- Secure reset flow

**Social Login:**
- Google OAuth integration
- Phone number verification via OTP

**Enhanced Profile:**
- Profile picture upload
- Delivery address management
- Payment method storage
- Notification preferences

**Order Management:**
- Order tracking
- Reorder functionality
- Order cancellation
- Rating and reviews
