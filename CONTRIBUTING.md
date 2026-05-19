# Contributing to TableGov

Thanks for your interest. TableGov is governance infrastructure — small surface area, intentionally constrained. Contributions are welcome where they sharpen the existing mechanisms or harden their cryptographic guarantees.

## Local development

```bash
git clone https://github.com/TheArcitect/tablegov.git
cd tablegov
npm install
npm run dev
```

The dev server runs on Vite's default port. Hot reload is on.

## Running the test suite

```bash
npm run test       # watch mode
npm run test:run   # single run (used by CI)
npm run lint       # ESLint
npm run build      # type-check + production build
```

CI runs `lint`, `test:run`, and `build` on every push to `main` and every pull request.

## Branch and PR conventions

- Branch from `main`. Name branches with a short topic prefix: `fix/`, `feat/`, `chore/`, `docs/`.
- Keep PRs focused. One concern per PR.
- Reference the relevant module in the PR title where applicable (e.g. `feat(sortition): stratified pool import`).
- Pre-merge checklist: lint clean, all tests pass, build succeeds, CI green.

## What to be careful about

TableGov is governance infrastructure. The six core mechanisms — Charter Generator, Sunset Clock, Sortition Engine, No-Confidence Portal, Seven-Generation Assessment, and Audit Trail — are designed around two cryptographic invariants:

1. **Sortition is deterministic and verifiable.** Given a seed and a stakeholder pool, selection is reproducible. Anyone can re-run the selection and confirm the result. PRs that change the selection algorithm or the seed surface area should preserve this property and add test coverage.

2. **The audit log is hash-chained and tamper-evident.** Each entry's hash incorporates the prior entry's hash. Modifying any historical entry breaks the chain in a way the verifier detects. PRs that touch audit construction or verification must preserve this property and add test coverage.

If a change loosens either invariant, call it out in the PR description and explain the reasoning.

## Scope

TableGov is intentionally minimal. Before adding dependencies or new modules, consider whether the change can be expressed within the existing primitives. If you're unsure, open an issue first.

## License

Contributions are accepted under the MIT License (see `LICENSE`).
