# Design Decisions

## 1. How did you ensure idempotency?

Idempotency is ensured through multiple strategies:

### Session Creation (POST /sessions)
- **Atomic Upsert Operation**: Using MongoDB's `findOneAndUpdate` with `upsert: true` and `$setOnInsert` operator. This ensures that:
  - If the session doesn't exist, it creates a new one
  - If it already exists, it returns the existing session without modification
  - The operation is atomic, preventing race conditions
- **Pre-check**: Before creating, we check if the session exists. If it does, we return it immediately (idempotent behavior)

### Event Creation (POST /sessions/:sessionId/events)
- **Unique Compound Index**: A unique compound index on `(sessionId, eventId)` ensures that duplicate events cannot be inserted at the database level
- **Atomic Upsert**: Using `findOneAndUpdate` with `upsert: true` and `$setOnInsert` ensures that:
  - If the event doesn't exist, it creates a new one
  - If it already exists, it returns the existing event without modification
- **Pre-check**: Before creating, we verify if the event already exists and return it if found

### Session Completion (POST /sessions/:sessionId/complete)
- **Status Check**: Before updating, we check if the session is already completed. If so, we return the existing session without modification
- **Idempotent Update**: Multiple calls with the same sessionId will result in the same final state

## 2. How does your design behave under concurrent requests?

The design handles concurrent requests safely through:

### Database-Level Atomic Operations
- **MongoDB Atomicity**: All write operations use MongoDB's atomic operations (`findOneAndUpdate` with `upsert`), which are guaranteed to be atomic at the database level
- **No Race Conditions**: The `$setOnInsert` operator ensures that initial values are only set on insert, not on update, preventing overwrites

### Session Creation
- Multiple concurrent requests to create the same session will:
  1. First request: Creates the session
  2. Subsequent requests: Return the existing session (idempotent)
  - All handled atomically by MongoDB

### Event Creation
- Multiple concurrent requests to create the same event will:
  1. First request: Creates the event
  2. Subsequent requests: Return the existing event (idempotent)
  - The unique compound index prevents duplicate inserts at the database level
  - MongoDB's atomic operations ensure consistency

### Session Completion
- Multiple concurrent requests to complete the same session will:
  1. All requests check the current status
  2. First request: Updates status to completed
  3. Subsequent requests: Return the already-completed session (idempotent)

## 3. What MongoDB indexes did you choose and why?

### ConversationSession Collection

1. **`sessionId` (single field, unique)**
   - **Purpose**: Primary lookup key for all session operations
   - **Why**: All endpoints require session lookup by sessionId. Unique constraint ensures no duplicates.

2. **`status` (single field)**
   - **Purpose**: Filter sessions by status
   - **Why**: Common query pattern for finding active/completed sessions

3. **`startedAt` (descending)**
   - **Purpose**: Sort sessions by creation time
   - **Why**: Useful for listing recent sessions

4. **`endedAt` (single field)**
   - **Purpose**: Filter completed sessions by end time
   - **Why**: Useful for analytics and reporting queries

5. **`(sessionId, status)` (compound)**
   - **Purpose**: Optimize queries that filter by both sessionId and status
   - **Why**: Common pattern for checking session state

### ConversationEvent Collection

1. **`sessionId` (single field)**
   - **Purpose**: Primary lookup key for finding all events in a session
   - **Why**: All event queries filter by sessionId

2. **`(sessionId, eventId)` (compound, unique)**
   - **Purpose**: Ensure eventId uniqueness per session and enable fast lookups
   - **Why**: Critical for idempotency - prevents duplicate events. Enables O(1) lookup for event existence checks.

3. **`(sessionId, timestamp)` (compound)**
   - **Purpose**: Optimize paginated queries that fetch events ordered by time
   - **Why**: The GET /sessions/:sessionId endpoint requires events sorted by timestamp. This compound index allows MongoDB to:
     - Use the index for both filtering (sessionId) and sorting (timestamp)
     - Avoid in-memory sorting for large result sets
     - Support efficient pagination with skip/limit

### Index Strategy Rationale
- **Query-Driven**: All indexes are based on actual query patterns from the API requirements
- **Write Performance**: Minimal indexes to balance read performance with write overhead
- **Compound Indexes**: Used strategically where queries filter and sort on multiple fields
- **Unique Constraints**: Applied where business logic requires uniqueness

## 4. How would you scale this system for millions of sessions per day?

### Database Scaling

1. **MongoDB Sharding**
   - **Shard Key**: `sessionId` (ensures all data for a session stays together)
   - **Benefits**: Distributes load across multiple shards, allows horizontal scaling
   - **Consideration**: Events are co-located with sessions (same shard) for efficient queries

2. **Read Replicas**
   - Deploy read replicas for GET operations
   - Separate read and write traffic
   - Reduce load on primary database

3. **Connection Pooling**
   - Optimize MongoDB connection pool size
   - Use connection string with proper pool configuration

### Application Scaling

1. **Horizontal Scaling**
   - Stateless application design allows multiple instances
   - Load balancer distributes requests across instances
   - No shared state between instances

2. **Caching Layer**
   - **Redis Cache**: Cache frequently accessed sessions
   - **Cache Strategy**: 
     - Cache session data with TTL
     - Invalidate on updates
     - Cache-aside pattern

3. **Event Streaming**
   - For high-volume event ingestion, consider:
     - Kafka/RabbitMQ for event buffering
     - Async processing of events
     - Batch inserts to MongoDB

### Query Optimization

1. **Pagination Improvements**
   - Move from offset-based to cursor-based pagination for better performance
   - Use `_id` or `timestamp` as cursor for efficient pagination

2. **Aggregation Pipeline**
   - Use MongoDB aggregation for complex queries
   - Pre-aggregate common metrics

3. **TTL Indexes**
   - Add TTL indexes for old sessions/events if retention policy exists
   - Automatically clean up old data

### Monitoring & Observability

1. **Performance Monitoring**
   - Track query performance
   - Monitor index usage
   - Set up alerts for slow queries

2. **Metrics**
   - Request rate, latency, error rates
   - Database connection pool metrics
   - Cache hit/miss ratios

### Additional Considerations

1. **Data Archival**
   - Archive old sessions to cold storage
   - Keep recent data hot for fast access

2. **Rate Limiting**
   - Implement rate limiting per client/IP
   - Prevent abuse and ensure fair resource usage

3. **Circuit Breakers**
   - Implement circuit breakers for database connections
   - Graceful degradation under high load

## 5. What did you intentionally keep out of scope, and why?

### Authentication & Authorization
- **Why**: Explicitly stated as not required in the assignment constraints
- **Future**: Would add JWT-based authentication and role-based access control

### Background Jobs & Queues
- **Why**: Explicitly stated as not required in the assignment constraints
- **Future**: Would add event processing queues for high-volume scenarios

### External Services
- **Why**: Explicitly stated as not required in the assignment constraints
- **Future**: Would integrate with notification services, analytics platforms

### Advanced Features

1. **WebSocket/Real-time Updates**
   - **Why**: Not in requirements, adds complexity
   - **Future**: Would add for real-time event streaming to clients

2. **Event Versioning**
   - **Why**: Requirements state events are immutable, no versioning needed
   - **Future**: If needed, would add version field and migration strategy

3. **Soft Deletes**
   - **Why**: Not in requirements, adds complexity
   - **Future**: Would add `deletedAt` field if deletion is needed

4. **Audit Logging**
   - **Why**: Not in requirements
   - **Future**: Would add audit trail for compliance

5. **Data Validation Beyond Basic**
   - **Why**: Kept simple with class-validator
   - **Future**: Would add schema validation for payload structures

6. **Comprehensive Error Handling**
   - **Why**: Basic error handling implemented
   - **Future**: Would add custom exception filters, error codes, detailed error messages

7. **Unit/Integration Tests**
   - **Why**: Assignment states tests are not mandatory
   - **Future**: Would add comprehensive test suite with high coverage

8. **API Documentation (Swagger)**
   - **Why**: Not in requirements
   - **Future**: Would add Swagger/OpenAPI documentation

9. **Request/Response Logging**
   - **Why**: Basic logging implemented
   - **Future**: Would add structured logging, request tracing

10. **Health Checks & Metrics Endpoints**
    - **Why**: Not in requirements
    - **Future**: Would add `/health` and `/metrics` endpoints

### Design Philosophy
The solution focuses on **correctness, clarity, and core functionality** as requested. Additional features would be added based on actual production requirements and priorities.

