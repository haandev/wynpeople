# wynPeople

An HR app (people directory, effective-dated job/status/pay history, time off with accruals and approvals, reports, GDPR tooling) built on **[Wyndbase](https://dev.wyndbase.dev)** with **zero custom backend**: the React client in `app/` talks only to Wyndbase named queries, rules and flows.

## Layout

| Path | What |
|---|---|
| `app/` | React + Vite + TanStack client (`bun --cwd=app run dev`, http://localhost:5174) |
| `base/` | Wyndbase sources: schema notes, named queries (`queries/`), rules (`rules/`), seed data and test evidence (`tests/`) |
| `docs/` | Design, plan, acceptance checklist, rulings and the built-ins report |
| `wyndbase-findings.md` | Every Wyndbase bug, gap and wall met while building it (in Turkish) |

## Built-ins used

Effective-dated columns (job, manager, office, status as an effective `state` column), check constraints that bind every writer, `sensitive` columns with access logs, interaction steps with approval delegation, in-app notifications, file columns and profile pictures, flows on table triggers, and the Wyndbase devtools.

## Running

```bash
bun install --cwd=app
bun --cwd=app run dev
```

The client signs in against the `wynpeople` base on dev.wyndbase.dev (OAuth client `wynpeople-web`).
