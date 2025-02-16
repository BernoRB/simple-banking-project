### 0.0.6
## Transaction history
- Added transaction history endpoint (GET /transactions) with filtering capabilities by date and transaction type

### 0.0.5
## Transfer balance
- Added money transfer functionality with POST /transactions/transfer endpoint, allowing users to transfer money to other users with optional description
- Enhanced transaction tracking to clearly differentiate between sent and received transfers

### 0.0.4
## Add balance
- Added deposit functionality: users can now deposit money into their accounts via POST /transactions/deposit endpoint
- Implemented transaction history tracking for all deposits

### 0.0.3
## Swagger Implementation
- Added swagger implementation

### 0.0.2
## Auth Implementation
- Added JWT authentication system
- Created auth module with login endpoint (POST /auth/login)
- Implemented JWT strategy for protected routes
- Protected routes now require Bearer token authentication

### 0.0.1
- Start project, POST /user and GET /user/:id endpoints