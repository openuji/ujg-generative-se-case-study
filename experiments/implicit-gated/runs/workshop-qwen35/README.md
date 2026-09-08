# Workshop Registration Application

This is an implementation of the workshop registration system based on the User Journey Graph (UJG) specification. The system follows the UJG domain model and implements the necessary domain operations and state transitions.

## Architecture

### Domain Layer (`apps/domain`)
The domain layer implements the authoritative behavior based on the UJG domain model:
- Workshop registration and waitlist logic
- Offered place handling
- Domain invariants and pre/post conditions
- Implementation of all domain operations (`confirm-workshop-registration`, `join-workshop-waitlist`, `accept-offered-place`, `decline-offered-place`)

### UI Layer (`apps/ui`)
The UI layer provides the browser interface that realizes the UJG journey entries and state machines:
- Workshops overview
- Workshop detail pages
- Registration forms
- Waitlist functionality
- Offered place handling

## Testing and Validation

This implementation follows the UJG full-application generation protocol:
1. The application is implemented according to the manifest in `ujg-implementation.yaml`
2. It correctly implements the UJG's state transitions and entry points
3. Domain behavior follows the specified domain model, conditions, and invariants
4. All implementation details are derived from the UJG specification

## Running the Application

To run the application:
1. Navigate to the project root
2. Run `npm install` to install dependencies
3. Run `npm start` to start the application server
4. Access the application at `http://localhost:3000`