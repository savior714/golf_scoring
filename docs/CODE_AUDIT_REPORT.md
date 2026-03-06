# Golf Scoring Application - Code Audit & Improvement Report

## 1. Executive Summary
This document outlines the current logical flaws, performance bottlenecks, and architectural improvements identified during the audit of the Golf Scoring application (March 2026). The focus is on data integrity, synchronization efficiency, and scoring accuracy.

---

## 2. Identified Logical Flaws & Risks

### 2.1 Storage Concurrency (Critical Risk)
*   **Location**: `src/modules/golf/golf.repository.ts`
*   **Issue**: `AsyncStorage` operations follow a "Read-Merge-Write" pattern without any locking or serialization mechanism.
*   **Risk**: If `pullRoundsFromSupabase` (triggered on Dashboard focus) and `saveRound` (triggered in the recording screen) happen concurrently, they may overwrite each other's changes in `AsyncStorage`, leading to localized data loss.
*   **Recommendation**: Implement an **Async Mutex** or a **Sequenced Operation Queue** to ensure only one write operation to a specific storage key can occur at a time.

### 2.2 Network Efficiency in Master Data (Performance)
*   **Location**: `clubRepository.registerClub`
*   **Issue**: Registration logic executes individual `upsert` calls for every single hole (18~27) and distance (4 colors per hole).
*   **Impact**: Registering a 27-hole club triggers ~140+ individual network requests, leading to slow UI response and high risk of rate-limiting or timeout.
*   **Recommendation**: Batch the hole and distance data into single `upsert` calls using arrays:
    ```typescript
    // Instead of looping individual inserts:
    await supabase.from('golf_holes').upsert(allHolesInCourse);
    await supabase.from('hole_distances').upsert(allDistancesInCourse);
    ```

### 2.3 Background Sync Transparency (UX/Reliability)
*   **Location**: `app/(tabs)/record.tsx`
*   **Issue**: `syncRoundToSupabase` is called without `await` to provide a non-blocking UI.
*   **Impact**: There is no feedback mechanism for failed background syncs. If the network is unstable during a round, the user might assume data is in the cloud when it only exists locally.
*   **Recommendation**: Implement a **Persistent Queue for Sync** or add a "Cloud Status" icon (Syncing/Success/Failed) in the header to notify the user of background status.

---

## 3. Data Model & Architecture Improvements

### 3.1 Tee Color Schema
*   **Current State**: Tee color is stored as a string hack in the `memo` field (`TEE:Black`).
*   **Issue**: Fragile and difficult to query for statistics (e.g., "Show my average score with Blue tees").
*   **Action**: Add a `tee_color` column to the `rounds` table in Supabase and update `GolfRound` type.

### 3.2 Score Categorization Accuracy
*   **Location**: `golf.service.ts`
*   **Issue**: `summary.doubles` aggregates Double Bogey, Triple Bogey, and worse into one category.
*   **Action**: Split into `doubleBogeys` and `tripleBogeysOrWorse` to provide better performance insights for users.

### 3.3 Auth State Race Conditions
*   **Location**: `golf.repository.ts` -> `pullRoundsFromSupabase`
*   **Status**: Partially addressed with `sessionOverride`, but the cleanup of `AsyncStorage` on logout should be strictly enforced before any new login attempt to prevent cross-account leakage.

---

## 4. Proposed Action Plan (Phased)

1.  **Phase 1 (Data Integrity)**: Implement storage lock in `roundRepository` and add `tee_color` column.
2.  **Phase 2 (Performance)**: Refactor `registerClub` to use batch upserts.
3.  **Phase 3 (UX)**: Add background sync status indicator to the `record.tsx` header.

---
**Document Status**: Draft / Audit Complete (2026-03-06)
