# Contributing to AI Interview Coach

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ai-interview-coach.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Cloudflare account (for Workers AI)

### Setup
```bash
# Install Worker dependencies
cd worker
npm install

# Install Web app dependencies
cd ../apps/web
npm install
```

### Running Locally
```bash
# Worker (local mode)
cd worker
npm run dev

# Web app
cd apps/web
npm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Testing

Before submitting a PR:
- [ ] Type check passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] Test manually in local development
- [ ] Update documentation if needed

## Pull Request Process

1. Update README.md if needed
2. Add tests if applicable
3. Ensure all checks pass
4. Request review from maintainers

## Questions?

Open an issue for questions or discussions about features.

