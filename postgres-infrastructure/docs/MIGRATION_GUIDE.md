# Relational Data Layer Migration Guide

This document defines the production cutover roadmap, operational architecture, and risk mitigation procedures for transitioning MentorQ's primary store from MongoDB to PostgreSQL.

## 1. Objectives & Guarantees
- Strict foreign key constraints and transactional integrity across users, roles, and tickets.
- Zero-downtime execution using a dual-write sync model.
- Continuous backward compatibility during validation phases.

## 2. Cutover Lifecycle Phases
1. **Phase 1: Dual-Write Ingestion** — Active application routes writes to both MongoDB and PostgreSQL simultaneously.
2. **Phase 2: Historical Synchronization** — Scheduled background worker scripts backfill legacy historical documents.
3. **Phase 3: Integrity Auditing** — Automated checksum validation compares state across both data stores.
4. **Phase 4: Read Traffic Switch** — Shift read queries to PostgreSQL with MongoDB remaining in warm standby.
5. **Phase 5: Final Deprecation** — Decommission MongoDB drivers and teardown legacy instances.

docs(infra): detail phased cutover and dual-write lifecycle

## 3. Data Type Mapping Reference
| MongoDB (BSON) | PostgreSQL Type | Prisma Primitive | Conversion Rules |
| :--- | :--- | :--- | :--- |
| `ObjectId` | `UUID` | `String @id @default(uuid())` | Hex string converted to RFC 4122 UUID v4 |

## 4. Referential Integrity & Index Strategy
- **User -> MentorProfile**: One-to-one strict relation utilizing `ON DELETE CASCADE`.
- **User -> Tickets**: One-to-many relationship utilizing `ON DELETE RESTRICT` to preserve audit records.
- **Performance Indexes**:
  - `User`: Compound index on `[email, role]` for credential lookups.
  - `Ticket`: Compound index on `[status, createdAt]` for queue prioritization.
| `String` | `VARCHAR(255)` / `TEXT` | `String` | Explicit limits applied to emails/usernames |
| `Date` | `TIMESTAMPTZ` | `DateTime @default(now())` | ISO-8601 strings normalized to UTC |
| `Boolean` | `BOOLEAN` | `Boolean` | Default flags explicitly enforced |
| `Array` | `JSONB` / Join Table | Relational Model | Normalized into dedicated relational schemas

## 5. Connection Pooling Architecture
- **Connection Adapter**: PgBouncer / Prisma Client connection pool.
- **Instance Configuration**:
  - Pool Size: `10` active connections per node worker.
  - Idle Connection Timeout: `30,000 ms`.
  - Connection Acquisition Timeout: `2,000 ms`.
- **Target Saturation**: Maintain total active connections below 75% of server capacity

## 6. Historical Data Backfill Mechanics
- Background batch ingestion processes records in deterministic chunks of **500 items**.
- Checkpoint persistence tracked inside the operational table `_migration_progress`.
- Relational mapping execution order:
  1. Base `User` records populated first.
  2. Sub-entities (`MentorProfile`, `Ticket`) mapped against the newly assigned primary UUIDs
