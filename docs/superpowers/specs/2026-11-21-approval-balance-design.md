# Balance after approval, on the approval card — short design

**Date:** 2026-11-21 · **Size:** small change · **Source:** customer feature request

## Intent

When a manager answers a time off request, they should see how much of that type the person will have left at the end of the leave if they approve it. The customer asked for this for the **approver**, not for the employee.

## Goals / non-goals

- Goal: one line on the approval card: "If approved, balance on <end date>: N h", plus how it was worked out.
- Goal: the same card everywhere it appears (notification bell / inbox, My approvals widget, Time Off page), because it is one component.
- Non-goal: changing the employee's request dialog.
- Non-goal: any change on the server (approach A, chosen by the customer).
- Anti-goal: showing a number that looks precise but ignores future accruals or leave already booked.

## Approaches

- **A. Client only (chosen):** the card reads the employee's ledger and projected accruals with the approver's own access, and works the balance out with the existing calculator logic. No server change. Someone covering approvals (out of office) cannot read the ledger, so they see "Balance not available to you".
- B. Server query: a new elevated query, keyed by request id, that checks the caller may answer the request and returns the balance data. It works for people covering approvals too, at the cost of a security check on the server. Not chosen.

## Design

- Data: the request (`params.requestId`) gives the employee, the type, the dates and the hours. `pto.ledgerHistory` gives the employee's ledger and `pto.projectedAccruals` (until = end date) gives what they will earn by then. Both are already readable by the manager and by HR for the office.
- Calculation, for the request's type: ledger entries up to the end date (today's balance plus leave already booked up to then), plus projected accruals up to the end date, minus this request's hours. This is the same calculation as the home-page Time off calculator, moved into a shared, tested function. Whether this request is already in the ledger needs checking during the build; if it is, it must not be subtracted twice.
- Display:
  ```
  If approved, balance on 30 Nov: 3 h
    today 38 h · earned by then +13 h · booked −0 h · this request −48 h
    another 8 h is pending
  ```
  The result is red when it is below zero. Other pending requests of the same type are shown on their own line and are not subtracted from the result (my call: the approver decides each request on its own).
- Not shown: sick leave types (as in the request dialog), and requests that are no longer pending.
- No read access (someone covering approvals): "Balance not available to you." in grey.

## Left to the builder

The layout of the breakdown line, and loading and error states, following the existing cards.
