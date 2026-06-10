# WarisanKita — AI-Powered Islamic Estate Planning Platform

> Smart Wasiyyah & Faraid Distribution Platform
> *ICT Development for Ummah Needs — Group Project (Year 3, Semester 2)*

WarisanKita helps any Muslim adult draft a Shariah-compliant **wasiyyah**, automatically
computes the **Faraid** (Islamic inheritance) distribution per Qurʾan An-Nisaʾ 11–12 & 176, and
anchors every change on a **tamper-evident blockchain vault** — directly addressing the estimated
RM 70+ billion of frozen Muslim estates in Malaysia.

This repository is a **complete, runnable prototype**: a React web client, a Node/TypeScript API,
a fully-tested Faraid engine, a hash-chained ledger, and a fiqh-grounded education hub.

---

## ✨ The seven features (all implemented)

| # | Feature | Where |
|---|---------|-------|
| 1 | **AI Wasiyyah Drafter** — scripted, fiqh-grounded 7-step conversational flow | `/draft` |
| 2 | **Faraid Calculation Engine** — exact Quranic shares, ʿasabah, ḥajb, ʿaul, radd, kalalah | `/faraid`, `server/src/faraid` |
| 3 | **Family Tree Builder** — add heirs; exclusions (mahjūb) auto-detected | `/heirs` |
| 4 | **Blockchain Wasiyyah Vault** — SHA-256 hash chain + live tamper-detection demo | `/vault` |
| 5 | **Hibah & Waqf Planner** — lifetime giving + 1/3 bequest cap enforcement | `/hibah-waqf` |
| 6 | **e-Signature & 2-Witness Module** — pre-sign checklist, simulated MyDigital ID PKI | `/sign` |
| 7 | **Faraid Education Hub** — bite-sized lessons + verified Q&A with citations | `/learn` |

---

## 🟢 Live vs. ⚠️ Simulated (honesty matters)

This is a university prototype. The Islamic logic is **real and correct**; external government and
infrastructure integrations are **simulated**, because they require partnerships and credentials
that cannot exist in a student project.

| Component | Status | Notes |
|-----------|--------|-------|
| Faraid calculation engine | 🟢 **Real** | Exact rational arithmetic, 15 passing tests against textbook cases |
| 1/3 bequest rule & estate settlement order | 🟢 **Real** | Enforced in code with citations |
| Wasiyyah drafting / family tree / hibah / waqf | 🟢 **Real** | Full CRUD, persisted |
| Blockchain vault | 🟢 **Real hash chain** ⚠️ *not Fabric* | Tamper-evident SHA-256 chain replacing Hyperledger Fabric locally |
| MyDigital ID / JPN eKYC | ⚠️ **Simulated** | No real government API access |
| e-Signature (PKI) | ⚠️ **Simulated** | Deterministic SHA-256 signature digest |
| Llama 3 + RAG assistant | ⚠️ **Scripted** | Deterministic flow grounded in a local fiqh corpus (no model/network needed) |
| Database | 🟢 JSON file ⚠️ *not Postgres* | Behind a repository interface; swappable for PostgreSQL |

> ⚖️ **Always verify a real distribution with a certified faraidh practitioner / JAKIM.**

---

## 🚀 Quick start

**Prerequisites:** Node.js ≥ 18 (tested on v26) and npm.

```bash
cd warisankita
npm install        # installs server + client workspaces
npm run dev        # starts API (:4000) and web client (:5173) together
```

Then open **http://localhost:5173**. On first load the app seeds a demo wasiyyah
("Ahmad bin Ali", RM 1.2M estate) so every screen is populated like the proposal mockups.

### Other commands

```bash
npm test           # run the Faraid engine test suite (15 tests)
npm run build      # type-check + bundle server and client for production
npm start          # run the built API (after npm run build)
```

---

## 🧮 The Faraid engine (the core)

Located in [`server/src/faraid`](server/src/faraid). Highlights:

- **Exact fractions** (`fraction.ts`) — no floating-point error; shares stay as reduced rationals.
- **Fixed shares (furūḍ)** for spouses, parents, grandparents, children, grandchildren, and all
  three sibling types (full / paternal / maternal).
- **Residuary (ʿasabah)** distribution — *"to the male a share equal to two females."*
- **Exclusion (ḥajb)** — e.g. a son screens grandsons & brothers; the father screens all siblings;
  excluded heirs are returned explicitly so the UI can show *why*.
- **ʿAul** (proportional reduction when shares exceed the estate) and **radd** (return of surplus).
- **al-ʿUmariyyatan / al-Gharrawayn** special case (spouse + both parents).
- Every share carries a plain-language **reason + citation**.

> **Madhhab note:** shares follow the position common to the Sunni schools with a Shafiʿi default.
> The grandfather-with-siblings (*jadd wa ikhwah*) case treats the grandfather like the father and
> emits a note recommending scholar review.

Run `npm test` to see it validated against classic cases (ʿaul 7/6, radd, kalalah, mahjūb, …).

---

## 🏗️ Architecture

```
warisankita/
├── server/                 Node + Express + TypeScript API
│   └── src/
│       ├── faraid/         Faraid engine (+ tests, fractions, labels, serialiser)
│       ├── blockchain/     Hash-chained ledger (Hyperledger Fabric stand-in)
│       ├── wasiyyah/        Domain types, service, scripted drafter
│       ├── data/           Fiqh corpus (lessons, FAQ, citations)
│       ├── db/             JSON persistence (repository interface)
│       └── routes/         REST API (faraid, wasiyyah, vault, education)
└── client/                 React + Vite + TypeScript web app
    └── src/
        ├── components/     AppBar, Donut (CSS conic-gradient chart)
        ├── screens/        Home, Drafter, FaraidResult, FamilyTree, Assets,
        │                   Vault, HibahWaqf, ESign, Education
        ├── store.tsx       App context (current wasiyyah)
        └── api.ts          Typed API client
```

Maps to the proposal's 5-tier design: Client → API Gateway → Services → Data/Ledger → (simulated)
Government integrations.

---

## ☁️ Deployment

- **Client:** `npm run build --workspace client` → static files in `client/dist` (deploy to
  Vercel / Netlify / any static host). Point its `/api` to the deployed API origin.
- **Server:** `npm run build --workspace server` then `npm start` (deploy to Render / Railway /
  a VPS). For real use, swap the JSON store for PostgreSQL behind the same repository interface.

---

## 🪟 Windows note (important for this folder)

This project lives under a path containing `&` (`ICT&Islam`). Windows `cmd.exe` treats `&` as a
command separator, which breaks npm's default `.bin` script shims. To stay reliable, **all npm
scripts invoke tools via relative `node node_modules/...` paths** instead of the shims — so
`npm run dev`, `npm test`, and `npm run build` work even from this path.

---

## 📜 Islamic & academic framing

- **Maqasid al-Shariah:** Ḥifẓ al-Māl (wealth), al-Nasl (lineage), al-Dīn (religion),
  al-Nafs (life), al-ʿAql (intellect).
- **Necessity level:** Ḍharūriyāt — fulfilling Quranic inheritance commands.
- *"Whoever leaves wealth, it is for his heirs."* — Sahih al-Bukhari 2298.

---

*Prototype for educational purposes. Not a substitute for professional legal or Shariah advice.*
