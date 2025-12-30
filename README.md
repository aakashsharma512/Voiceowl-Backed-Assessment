# Conversation Session Service

A backend service for managing conversation sessions and events in a Voice AI platform, built with NestJS, TypeScript, and MongoDB.

## Overview

This service provides APIs for:
- Creating and managing conversation sessions
- Adding events to sessions
- Retrieving sessions with paginated events
- Completing sessions

All operations are designed to be idempotent and safe under concurrent requests.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher) - running locally or via Docker
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
Ensure MongoDB is running on your local machine:
```bash
# Default connection: mongodb://localhost:27017/conversation-sessions
```

#### Option B: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option C: Custom MongoDB URI
Set the `MONGODB_URI` environment variable:
```bash
export MONGODB_URI="mongodb://your-mongodb-uri/conversation-sessions"
```

### 3. Environment Variables (Optional)

Create a `.env` file in the root directory (optional):
```
MONGODB_URI=mongodb://localhost:27017/conversation-sessions
PORT=3000
```

## Running the Project

### Development Mode
```bash
npm run start:dev
```

The application will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

### Production Build
```bash
npm run build
npm run start:prod
```

## API Endpoints

### 1. Create or Upsert Session
**POST** `/sessions`

Creates a new session or returns existing one if sessionId already exists (idempotent).

**Request Body:**
```json
{
  "sessionId": "session-123",
  "language": "en",
  "status": "initiated",
  "metadata": {
    "userId": "user-456",
    "callId": "call-789"
  }
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "session-123",
  "status": "initiated",
  "language": "en",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": null,
  "metadata": {
    "userId": "user-456",
    "callId": "call-789"
  }
}
```

### 2. Add Event to Session
**POST** `/sessions/:sessionId/events`

Adds an event to a session. Duplicate requests with the same eventId are idempotent.

**Request Body:**
```json
{
  "eventId": "event-001",
  "type": "user_speech",
  "payload": {
    "text": "Hello, I need help",
    "confidence": 0.95
  },
  "timestamp": "2024-01-15T10:00:05.000Z"
}
```

**Event Types:** `user_speech`, `bot_speech`, `system`

**Response:** `201 Created`
```json
{
  "eventId": "event-001",
  "sessionId": "session-123",
  "type": "user_speech",
  "payload": {
    "text": "Hello, I need help",
    "confidence": 0.95
  },
  "timestamp": "2024-01-15T10:00:05.000Z"
}
```

### 3. Get Session with Events
**GET** `/sessions/:sessionId?limit=50&offset=0`

Retrieves a session with its events, ordered by timestamp. Supports pagination.

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - Number of events to return
- `offset` (optional, default: 0) - Number of events to skip

**Response:** `200 OK`
```json
{
  "session": {
    "sessionId": "session-123",
    "status": "active",
    "language": "en",
    "startedAt": "2024-01-15T10:00:00.000Z",
    "endedAt": null,
    "metadata": {}
  },
  "events": [
    {
      "eventId": "event-001",
      "sessionId": "session-123",
      "type": "user_speech",
      "payload": {},
      "timestamp": "2024-01-15T10:00:05.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 4. Complete Session
**POST** `/sessions/:sessionId/complete`

Marks a session as completed and sets the endedAt timestamp. Idempotent operation.

**Response:** `200 OK`
```json
{
  "sessionId": "session-123",
  "status": "completed",
  "language": "en",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:05:00.000Z",
  "metadata": {}
}
```

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Session with ID session-123 not found",
  "error": "Not Found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["limit must be between 1 and 100"],
  "error": "Bad Request"
}
```

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
└── sessions/
    ├── sessions.module.ts           # Sessions feature module
    ├── sessions.controller.ts       # API endpoints
    ├── sessions.service.ts          # Business logic
    ├── schemas/
    │   ├── conversation-session.schema.ts
    │   └── conversation-event.schema.ts
    ├── repositories/
    │   ├── session.repository.ts    # Session data access
    │   └── event.repository.ts      # Event data access
    └── dto/
        ├── create-session.dto.ts
        ├── add-event.dto.ts
        └── query-params.dto.ts
```

## Assumptions

1. **Session IDs**: Session IDs are provided externally and are unique. The service does not generate them.

2. **Event IDs**: Event IDs are provided externally and must be unique within a session.

3. **Timestamps**: If not provided, event timestamps default to the current server time.

4. **Metadata**: Session metadata is stored as a flexible object with no schema validation.

5. **Event Payload**: Event payloads are stored as flexible objects with no schema validation.

6. **Pagination**: Default pagination limit is 50, maximum is 100. Offset-based pagination is used.

7. **Status Transitions**: No strict validation on status transitions (e.g., can go from any status to completed).

8. **Language Codes**: Language codes are stored as strings without validation (e.g., "en", "fr").

9. **Concurrency**: All operations are designed to handle concurrent requests safely using MongoDB atomic operations.

10. **Data Retention**: No automatic data cleanup or TTL policies are implemented.

## Design Decisions

See [DESIGN.md](./DESIGN.md) for detailed explanations of:
- Idempotency implementation
- Concurrent request handling
- MongoDB indexing strategy
- Scaling considerations
- Out-of-scope features

## Testing the API

### Using cURL

```bash
# Create a session
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "language": "en",
    "metadata": {"test": true}
  }'

# Add an event
curl -X POST http://localhost:3000/sessions/test-session-1/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-1",
    "type": "user_speech",
    "payload": {"text": "Hello"}
  }'

# Get session with events
curl http://localhost:3000/sessions/test-session-1?limit=10&offset=0

# Complete session
curl -X POST http://localhost:3000/sessions/test-session-1/complete
```

## Development

### Code Style
- Uses Prettier for code formatting
- Follows NestJS best practices
- TypeScript strict mode considerations

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## License

This is a take-home assignment project.

