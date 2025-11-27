# AI Agent Instructions

Instructions for AI coding assistants (Cursor, Claude, Gemini, Copilot, etc.).

## ⚠️ Critical: Always Lint After Code Changes

After modifying ANY TypeScript/JavaScript file, run:

```bash
npm run lint
```

If there are errors, fix them before finishing. Common fixes:

- Unused imports → Remove them
- `any` type → Use `unknown` or proper types
- Unused variables → Remove or prefix with `_`
- Missing return types → Add explicit types

## Commands

| Task          | Command                            |
| ------------- | ---------------------------------- |
| Lint          | `npm run lint`                     |
| Lint + fix    | `npm run lint:fix`                 |
| Format        | `npm run format`                   |
| Test          | `npm test`                         |
| Build         | `npm run build`                    |
| Generate docs | `cd packages/core && npm run docs` |

## Project Structure

```
storyloom/
├── packages/
│   ├── core/          # npm package "storyloom"
│   │   ├── src/
│   │   │   ├── index.ts      # Public exports
│   │   │   ├── types.ts      # TypeScript interfaces
│   │   │   ├── runtime.ts    # Story runtime engine
│   │   │   └── analyzer.ts   # Story validator
│   │   └── test/             # Jest tests
│   └── dev-ui/        # Dev playground (private)
└── .github/workflows/ # CI/CD
```

## Key Types

- `Story<TEffect>` - Complete story definition
- `Knot<TEffect>` - A section/chapter of the story
- `Node<TEffect>` - A single story beat with text and choices
- `Choice<TEffect>` - A player choice with target and optional effects
- `StoryRuntime<TEffect, TState>` - Runtime for navigating stories
- `StepResult<TEffect>` - Result of current() or choose()

## Code Rules

1. **No `any`** - Use `unknown` or specific types
2. **No `console.log/warn`** in library code - Throw errors instead
3. **JSDoc comments** on all public APIs
4. **Remove unused imports** immediately

## Before Finishing Any Task

1. `npm run lint` - must pass
2. `npm run format` - run it
3. `npm test` - must pass
4. `npm run build` - must succeed

## Don't

- ❌ Commit with lint errors
- ❌ Use `any` type
- ❌ Add console.log to library code
- ❌ Skip running tests after changes
