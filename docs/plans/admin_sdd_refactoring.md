# Admin Module SDD Refactoring Plan

## 1. Overview
As the `golf` module successfully transitioned to the **Spec-Driven Design (SDD)** architecture, the `admin` module (`src/modules/admin`) currently remains in its original structure where business logic is heavily embedded within hooks and components. To ensure long-term maintainability and consistency, the admin module should also be refactored into Domain, Application, and Infrastructure layers.

## 2. Goals
- **Separation of Concerns**: Decouple data validation and transformation (Domain) from task orchestration (Application) and storage logic (Infrastructure).
- **Consistency**: Use the same architectural patterns (`GolfApplicationService` style) across the entire codebase.
- **Improved Testability**: Make validation logic (e.g., bulk import parsing) easier to test by moving it to the domain layer.

## 3. Proposed Architecture

### 📂 `src/modules/admin/domain/`
- **Logic**: All parsing and validation of CSV/JSON club data.
- **Types**: `BulkImportPayload`, `ValidationIssue`, `ImportSummary`.
- **Services**: `AdminDomainService` (pure logic for data normalization).

### 📂 `src/modules/admin/application/`
- **Logic**: Orchestrates the import process, coordinates with `RoundRepository` or `ClubRepository`, and handles user session state for administrative tasks.
- **Service**: `AdminApplicationService`.

### 📂 `src/modules/admin/infrastructure/`
- **Logic**: Reuses `ClubRepository` from the `golf` module for actual registration. No new infrastructure is needed unless specific administrative logs are required.

## 4. Implementation Steps

1. **Step 1: Domain Extraction** (Done)
2. **Step 2: Application Layer Definition** (Done)
3. **Step 3: Component Migration** (Done)
4. **Step 4: Infrastructure & Cleanup** (Done)

## 5. Timeline (Draft)
- **Phase A**: Domain/Application layer setup (1 day).
- **Phase B**: Migration of Form/Import components (1 day).
- **Phase C**: Cleanup & Documentation sync (0.5 day).

> [!NOTE]
> The admin module already depends on the `golf` module's infrastructure (ClubRepository), so the refactoring will focus primarily on the Domain and Application layers.
