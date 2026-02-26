# TableGov

**Constitutional governance infrastructure for AI oversight bodies.**

TableGov is a working prototype that implements the governance mechanisms described in Schaeffer (2026), *"Recognition as Residual: An Information-Theoretic Framework for Epistemic Obstruction."* The paper formalizes **R = C − A** (Recognition = Contact minus Agenda) and applies it to institutional governance design. TableGov is the implementation.

## The Problem

Every AI governance proposal shares the same failure mode: the body that oversees powerful systems eventually captures itself. Review boards become rubber stamps. Sunset clauses get renewed automatically. Oversight committees optimize for their own survival rather than their stated mission.

These aren't moral failures. They're structural ones — and they're predictable using information theory.

## The Solution

TableGov implements six constitutional mechanisms designed to make self-capture structurally difficult:

| Module | Mechanism | What It Prevents |
|---|---|---|
| **Charter Generator** | Forces explicit articulation of power, purpose, and checks | Mission drift through ambiguity |
| **Sunset Clock** | Mandatory expiration with active renewal required | Institutional immortality |
| **Sortition Engine** | Cryptographically verifiable random selection from stratified pools | Capture through appointment |
| **No-Confidence Portal** | Stakeholder-initiated petitions with transparent thresholds | Unaccountable authority |
| **Seven-Gen Assessment** | Structured impact analysis across seven generations (~175 years) | Short-term optimization |
| **Audit Trail** | Hash-chained, tamper-evident log of all governance actions | Revisionist history |

## Architecture

- **React 19 + TypeScript** — Type-safe component architecture
- **Vite** — Build tooling
- **Hash-chained audit log** — SHA-256 linked entries, tamper-evident by construction
- **Cryptographic sortition** — Verifiable random selection with published seeds
- **Zero external dependencies for core governance logic** — No database, no server, no trust assumptions beyond the browser

## Quick Start

```bash
git clone https://github.com/TheArcitect/tablegov.git
cd tablegov
npm install
npm run dev
```

## Theoretical Foundation

The equation **R = C − A** (Schaeffer, 2026) formalizes a simple observation: recognition — the capacity of any system to respond to what is actually present — degrades in proportion to the agenda the system imports into the interaction.

Applied to governance: every oversight body imports structural agenda (self-preservation, regulatory capture, appointment bias, temporal myopia). TableGov doesn't eliminate agenda — it makes agenda *transparent* and *expirable*.

Each mechanism maps to a specific agenda-reduction strategy:

- **Sunset Clock** → Eliminates temporal agenda (the assumption of institutional permanence)
- **Sortition** → Eliminates selection agenda (the assumption that appointment produces competence)
- **No-Confidence** → Eliminates accountability agenda (the assumption that authority implies legitimacy)
- **Seven-Gen Assessment** → Eliminates horizon agenda (the assumption that current conditions persist)
- **Audit Trail** → Eliminates narrative agenda (the assumption that the record is honest)

## Paper

Schaeffer, M. (2026). *Recognition as Residual: An Information-Theoretic Framework for Epistemic Obstruction.* Preprint.

The paper establishes the formal framework. This repository is the implementation.

## License

MIT License. Use it, fork it, stress-test it. Governance infrastructure should be public by default.

## Author

**Michael Schaeffer** — Independent researcher. Former CEO (Knox Services, Yoga Lab, BlackHeart), Morgan Stanley. Currently focused on AI safety, governance infrastructure, and the gap Claude Shannon deliberately left open in 1948.

- [PhilPeople](https://philpeople.org/profiles/michael-schaeffer)
- [GitHub](https://github.com/TheArcitect)
