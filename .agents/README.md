# MentorQ Agents Directory

This directory contains specialized AI agents designed to automate, orchestrate, and enforce quality throughout the MentorQ development lifecycle.

```
.agents/
├── pipeline-state.md                  # Active runtime state ledger (SSOT & crash-recovery, uncommitted)
│
└── agents/
    ├── orchestrator/
    │   └── pipeline-orchestrator.md   # Master orchestrator governing the entire multi-agent lifecycle
    │
    ├── planning/
    │   └── task-batch-planner.md      # Decomposes tasks into <= 100-250 line verifiable batches
    │
    ├── architecture/
    │   ├── backend-architect-reviewer.md  # Reviews NestJS code against backend architectural guidelines
    │   └── frontend-architect-reviewer.md # Reviews React/TS code against frontend architectural guidelines
    │
    ├── ui/
    │   └── ui-design-system-reviewer.md   # [TEMPORARY] Audits & reviews frontend UI alignment with the MentorQ Design System
    │
    ├── git/
    │   ├── git-commit-crafter.md      # Drafts atomic Conventional Commits for PowerShell
    │   └── git-commit-evaluator.md    # Audits commits & executes upon approval
    │
    └── pr/
        ├── pr-drafter.md              # Drafts PR title, description, and push commands from git log
        └── pr-evaluator.md            # Audits PR vs git diff & creates PR via gh upon approval
```

---

## Complete End-to-End Orchestrated Pipeline

```mermaid
flowchart TD
    Orchestrator["pipeline-orchestrator\n(Master Supervisor)"] --> Planner["1. task-batch-planner\n(Cap: 100-250 lines/batch)"]

    subgraph BatchLoop ["Per-Batch Execution & Quality Gate"]
        Planner --> Implement["Implement Batch Changes"]
        Implement --> ArchReview["2. backend / frontend-architect-reviewer\n(Audit code vs architecture rules)"]
        ArchReview -->|Fix Issues| Implement
        ArchReview -->|Passed| CommitCraft["3. git-commit-crafter\n(Draft atomic conventional commits)"]
        CommitCraft --> CommitEval["4. git-commit-evaluator\n(Audit rules & execute on approval)"]
        CommitEval -->|Regenerate| CommitCraft
    end

    CommitEval -->|Next Batch| Planner
    CommitEval -->|All Batches Done| PRDraft["5. pr-drafter\n(Draft PR from git log)"]

    subgraph PRLoop ["Pull Request Finalization Gate"]
        PRDraft --> PREval["6. pr-evaluator\n(Audit PR vs git diff & create PR via gh)"]
        PREval -->|Revise PR| PRDraft
    end

    PREval --> UserHandOff["7. User Notification & Manual Merge Gate\n(User is the ONLY one who merges to main)"]
```

---

## Agent Categories & Detailed Roles

### 0. Orchestration (`orchestrator/`)
- **[`pipeline-orchestrator`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/orchestrator/pipeline-orchestrator.md)**: Coordinates the entire workflow. Ensures each batch passes architecture review before commit drafting, passes commit evaluation before execution, and passes PR evaluation before PR creation. Enforces the strict rule that **only the human user merges PRs to main**.

### 1. Planning (`planning/`)
- **[`task-batch-planner`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/planning/task-batch-planner.md)**: Breaks down large feature implementations and refactoring phases into focused, self-contained batches capped at 100-250 lines of code changes.

### 2. Architecture & Quality (`architecture/`)
- **[`backend-architect-reviewer`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/architecture/backend-architect-reviewer.md)**: Reviews backend NestJS code against Controller -> Service -> Repository 3-layer architecture, zero Mongoose document leakage, and EDA rules.
- **[`frontend-architect-reviewer`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/architecture/frontend-architect-reviewer.md)**: Reviews frontend React/TypeScript code against Page -> Component -> Store -> Service layering, RTK Query server-state discipline, Zustand client-state rules, and design system boundaries.

### 3. Git Commit Lifecycle (`git/`)
- **[`git-commit-crafter`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/git/git-commit-crafter.md)**: Drafts atomic Conventional Commits per architectural layer (no bulk commits, shields `docs/` and `.agents/pipeline-state.md`).
- **[`git-commit-evaluator`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/git/git-commit-evaluator.md)**: Audits proposed commits for Conventional Commits syntax, forbidden files (`docs/**`, `.agents/pipeline-state.md`), and PowerShell compatibility. **Executes approved commits directly** and verifies a clean working tree.

### 4. Pull Request Lifecycle (`pr/`)
- **[`pr-drafter`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/pr/pr-drafter.md)**: Uses committed git log (`origin/main..HEAD`) as the single source of truth to draft a professional PR title and description.
- **[`pr-evaluator`](file:///c:/Users/altha/OneDrive/Documents/MentorQ/.agents/agents/pr/pr-evaluator.md)**: Cross-checks the PR description against `git diff`, ensures zero forbidden files are committed, and verifies build status. **Pushes the branch and creates the PR via GitHub CLI (`gh`) upon approval.**

---

## State Persistence & Anti-Hallucination Mechanism

Multi-agent pipelines can suffer from context drift or lost memory during long executions or environment restarts. MentorQ solves this via the **Persistent State Ledger** (`.agents/pipeline-state.md`):

1. **Single Source of Truth (SSOT):** `task-batch-planner` writes the initial batch plan to `.agents/pipeline-state.md`.
2. **Consolidated Batch Updates:** As batches complete, `pipeline-orchestrator` updates status badges, logs reviewer feedback, and records commit SHAs directly on disk.
3. **Crash & Restart Resilience:** If a session resets or is paused, re-invoking `pipeline-orchestrator` immediately resumes from the earliest incomplete batch rather than starting over.
4. **Git Isolation:** `.agents/pipeline-state.md` acts as an ephemeral execution scratchpad and is strictly blocked from being staged into git commits by `git-commit-evaluator`.
