# storyloom

Core engine for Storyloom interactive storytelling framework.

## Installation

```bash
npm install storyloom
```

## Usage

```typescript
import { createRuntime, Story } from 'storyloom';

// Define your story
const story: Story<any> = {
  version: 1,
  entryKnot: 'start',
  knots: {
    start: {
      id: 'start',
      entryNode: 'intro',
      nodes: {
        intro: {
          id: 'intro',
          text: 'Your adventure begins...',
          choices: [
            {
              id: 'continue',
              label: 'Continue',
              target: { node: 'next' },
            },
          ],
        },
        next: {
          id: 'next',
          text: 'The story continues...',
          ending: { id: 'end', label: 'The End' },
        },
      },
    },
  },
};

// Create a runtime instance
const runtime = createRuntime(story);

// Get current step
const step = runtime.current();
console.log(step.text); // ['Your adventure begins...']

// Make a choice
const nextStep = runtime.choose('continue');
console.log(nextStep.text); // ['The story continues...']
```

## Features

- **Type-safe story definitions** - Full TypeScript support for stories, effects, and game state
- **Interactive storytelling runtime** - Manage story flow, choices, and state transitions
- **Branching narratives** - Support for complex story structures with knots and nodes
- **Effect system** - Track and apply effects from story choices
- **Story analyzer** - Validate stories for common issues like unreachable nodes and dead ends
- **Condition evaluation** - Support for conditional choices based on game state

## API

### `createRuntime<TEffect, TState>(story: Story<TEffect>, options?: RuntimeOptions<TState>)`

Creates a new story runtime instance.

### `runtime.current(state?: TState): StepResult<TEffect>`

Gets the current story step with available choices.

### `runtime.choose(choiceId: string, state?: TState): StepResult<TEffect>`

Makes a choice and advances the story.

### `runtime.divert(target: { knot: string; node: string }): void`

Jumps to a specific knot and node in the story.

### `analyzeStory<TEffect>(story: Story<TEffect>): AnalysisResult`

Analyzes a story for potential issues.

## Error Handling

The runtime throws descriptive errors when:

- A referenced knot or node doesn't exist
- A choice ID is not found
- A condition hook is referenced but not registered
- An expression evaluator is needed but not provided

This fail-fast behavior helps catch story structure issues during development.

## Documentation

- **[API Reference](https://jcpsimmons.github.io/storyloom/docs/)** - Full API documentation (auto-generated)
- **[GitHub Repository](https://github.com/jcpsimmons/storyloom)** - Source code and issues

### Building Documentation Locally

To generate the API documentation locally:

```bash
npm run docs
```

This creates a `docs/` folder with the full API reference. The docs are generated from TypeScript types and JSDoc comments, so they stay in sync with your code.

## License

MIT
