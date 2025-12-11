# Storyloom

A powerful TypeScript framework for creating interactive storytelling experiences.

## Packages

This monorepo contains:

- **[@storyloom/core](./packages/core)** - Core storytelling engine (published to npm)
- **[@storyloom/dev-ui](./packages/dev-ui)** - Development UI for testing stories (private)

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## Contributing

### Creating a Changeset

When making changes that should trigger a release:

```bash
npm run changeset
```

Follow the prompts to describe your changes. This will create a changeset file that will be used to generate changelogs and version bumps.

### Workflow

1. Create a feature branch
2. Make your changes
3. Run `npm run changeset` to document your changes
4. Commit the changeset file with your code
5. Open a pull request
6. After merge, Changesets will create a "Version Packages" PR
7. When the Version Packages PR is merged, packages are automatically published to npm

## Publishing

Publishing is automated via GitHub Actions when changesets are merged to the master branch.

## License

MIT
