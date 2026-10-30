---
paths:
  - 'resources/js/**'
---

# Js

## UX Loading State Hierarchy
Standardized UX loading hierarchy:
- Full-screen loader: Only on initial application open/reload. Never on every click or background poll.
- Skeleton loader: For loading pages and data state.
- Button spinner: For form saving, submitting, approving, rejecting actions.
- Toast notifications: For action completions and flash feedback.
