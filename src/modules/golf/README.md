# 🏌️ Golf Module Architecture (SDD)

This module follows the **Spec-Driven Design (SDD)** architecture to ensure business logic remains pure and decoupled from infrastructure details.

## 🏗️ 3-Layer Structure

### 1. 📂 `domain/` (Core)
- **Responsibility**: Pure business logic, entities, constants, and repository interfaces.
- **Dependencies**: None.
- **Key Files**: `golf.types.ts`, `errors.ts`, `repositories/`.

### 2. 📂 `application/` (Use Cases)
- **Responsibility**: Orchestrates domain logic and repositories to fulfill business scenarios.
- **Dependencies**: `domain/`.
- **Key Files**: Use case services (e.g., `golf.application.service.ts`).

### 3. 📂 `infrastructure/` (Technical implementation)
- **Responsibility**: Implementation of repository interfaces (Supabase, LocalStorage), external API clients, and UI-specific hooks/components.
- **Dependencies**: `domain/`, `application/`.
- **Key Files**: Persistence implementations, external adapters.

---

## ⚠️ Architectural Rules
- **No Circular Dependencies**: Lower layers must NEVER import from higher layers.
- **Interface-First**: Infrastructure must implement interfaces defined in the `domain` layer.
- **Standardized Error Handling**: Use classes from `domain/errors.ts` for all business-related failures.
- **Line Count**: Keep files below 500 lines by decomposing logic into specific sub-modules.
