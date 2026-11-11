# Contributing

Thanks for helping improve itchlib!

## Development

Use Node.js 22.19 or later.

Install dependencies:

```bash
npm ci
```

Before opening a pull request, run:

```bash
npm run check
npm run typecheck
npm run pack:check
```

### Guidelines

- When itch.io changes its page structure, update only the affected parser.
- Preserve original site data where possible instead of inventing classifications.

## Pull Requests

Describe what your changes do, any public API changes, and which checks you ran.

Never include real credentials, cookies, purchase keys, or private download URLs in logs.
