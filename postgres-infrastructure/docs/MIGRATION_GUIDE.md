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
