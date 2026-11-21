# wynpeople — UAT script

**Address:** https://wynpeople.pages.dev · **Data:** dev.wyndbase.dev, base `wynpeople` (demo data)
**Prepared by:** the development team · **Date:** 2026-11-21 · Previous acceptance checklist: [acceptance.md](acceptance.md) · Turkish version: [uat.md](uat.md)

This document lists the steps each role should go through end to end, the expected results, and how to report a problem. Mark each step with ✅ (works as expected), ❌ (a bug: report it with the template below) or ⚠️ (works, but is confusing).

---

## 1. Test users

Passwords are shared separately. On the first sign-in, the "wynpeople wants to access your account" screen asks you to **Authorize**. Use a separate browser profile (or a private window) for each role so the sessions don't mix.

| User | Person | Role | Office | Notes |
|---|---|---|---|---|
| `can.dev` | Can Öztürk | Employee | Istanbul | Reports to Deniz |
| `deniz.eng` | Deniz Kaya | Manager | Istanbul | Manages Can, Elif, Burak and Anna; no HR role |
| `mert.hrm` | Mert Demir | HR manager | Istanbul | Manages the Istanbul office only |
| `lena.hrm` | Lena Schmidt | HR manager | Berlin | Manages the Berlin office only |
| `ayse.hr` | Ayşe Yılmaz | HR admin | Istanbul | Sees and configures everything |

---

## 2. Known behaviour before you start

These are known and accepted; don't report them as bugs (do report them if they behave differently):

- **PDF export:** Turkish letters (ş, ı, ğ) may render incorrectly. CSV and XLSX are correct.
- **Between midnight and 03:00 (Istanbul):** The server's date is UTC. During these hours "today" is still yesterday for the server; an employee starting that day may briefly show an empty department or office.
- **Announcements:** For now they show in the "What's happening" widget on the home page and do not reach the notification bell. This will change when Wyndbase's built-in announcements feature arrives.
- **Data retention (GDPR) flow:** Runs monthly; it may not fire during UAT.
- **Platform:** Wyndbase is a preview release. If the platform is upgraded, the short check in section 7 is repeated.
- **Pay periods:** A period that crosses a year boundary (e.g. 20 Dec 2027 → 2 Jan 2028) is listed under the year it ends in; deleting a set also goes by the year a period ends.
- **Demo data:** Some records are left over from earlier tests (Anna's 2027 job title, Zz Demo, Deniz's old sick leave attempts; Deniz's sick leave balance is -8 h). These are not bugs.

---

## 3. Bug report template

```
Title: <short: what happened>
User: <e.g. can.dev>    Step: <e.g. E-04>
What I did: 1) … 2) … 3) …
What I expected: …
What happened: …  (screenshot, and the time if possible)
Browser: <Chrome / Safari …>
```

---

## 4. Role scripts

### Employee — `can.dev`

| # | Step | Expected |
|---|---|---|
| E-01 | Sign in and open the home page | Heading "Hi, Can"; widgets Time off, What's happening, My approvals (empty), Who's out, Celebrations, New team members, Links, Department/Office. **People without a pay raise, Length of service and Employment type are not shown.** |
| E-02 | Edit → drag a widget, resize it, remove one, add it back with Add widget, Done | The layout is saved and stays the same after a reload. The Add widget list has no HR widgets. |
| E-03 | In the Time off widget, move between types with the arrows; calculator icon → 3 months ahead | Hours available and hours booked; the estimated balance on the chosen date (today + to be earned − booked). |
| E-04 | My Info → Personal: change the preferred name and an emergency contact, save; under Education add a school, edit it, delete it | Saved; the education entry is listed, edited and deleted. An end date before the start date shows a warning. |
| E-05 | My Info → Job | Job history tables are shown; **the Compensation table shows your own pay only** (read-only); no Add change / Correct buttons. A colleague's profile shows no Compensation. |
| E-06 | My Info → Time Off | Balances, Upcoming Time Off, the Balance history chart (past as a solid line, future faded/dashed, a "Today" line); scheduled accruals and leave are marked in the table. |
| E-07 | Time Off → Request time off: a 2-day request with one day at 4 hours, send | The request shows as "Pending"; total 12 h; an approval request goes to Deniz. |
| E-08 | Cancel the same request | Status "Canceled"; it leaves Deniz's inbox. |
| E-09 | People → directory; open a colleague's profile | Work emails are shown; another person's address, phone and pay are not. The org chart opens. |
| E-10 | Reports → Standard reports | Only the reports open to employees (directory, own balances, usage, summary, availability, funnel, scheduled time off, new hires). **No** Terminations, Salary changes, Export log or Audit log. No Settings menu. |
| E-11 | Filter a report → Save report → name it; open it from My reports | The report is listed; Last viewed updates. |

### Manager — `deniz.eng`

| # | Step | Expected |
|---|---|---|
| M-01 | First send a new time off request as `can.dev`; then sign in as Deniz | The request shows in the notification bell and the "My approvals" widget; Review → Time Off. |
| M-02 | Approve the request with a note | Status "Approved"; **no** "HR override" label; Can gets an in-app notification and an email. |
| M-03 | Send a second request as Can; deny it as Deniz | "Denied"; Can is notified. |
| M-04 | Time Off → Out of office: lend your approvals to Burak for a week | Burak is listed; when Burak signs in he sees requests from Deniz's team labelled "For Deniz" and can answer them. Take it back with "End now". |
| M-05 | Open Can's profile | Past job periods are shown; Compensation is **not**. |
| M-06 | Home → Time off used widget | Approved time off of Deniz and his team, by month and type. |
| M-07 | Reports → My reports: a report Can saved is not visible unless it is shared | Someone else's report is not visible until it is shared. |

### HR manager — `mert.hrm` (Istanbul) and `lena.hrm` (Berlin)

| # | Step | Expected |
|---|---|---|
| H-01 | People → someone from your own office | Compensation is shown; Add change / Correct / Terminate buttons are available. |
| H-02 | People → someone from the **other** office | Compensation is not shown; no change buttons. |
| H-03 | Make a back-dated job change (e.g. employment type) for someone in your office | The change shows as a new period in the history; a new entry appears under Settings → Recalculations and **a "PTO recalculation" request reaches the notification bell**. |
| H-04 | Click the recalculation request in the bell → Preview → Apply (or Dismiss) | Settings → Recalculations opens, the entry has an "In your inbox" badge; within a few seconds it becomes "Applied" / "Dismissed"; the bell clears. The other office's HR manager does not see this request. |
| H-05 | The other Settings pages | Organization, Types, Policies, Pay periods and Holidays are read-only. |
| H-06 | Home: the People without a pay raise, Length of service and Employment type widgets | Shown; only people from your own office. |
| H-07 | Reports → Time off balances, Salary changes | Your own office only. Export to CSV → it appears in the Export log. |
| H-08 | Home → New… → Announcement: publish an announcement | It appears in everyone's "What's happening" widget. |

### HR admin — `ayse.hr`

| # | Step | Expected |
|---|---|---|
| A-01 | People → New employee: complete the hire wizard | The person is in the directory; Next is disabled while a required field is empty; a set-password email is sent. |
| A-02 | Settings → Organization: hover a unit → add a sub-unit with "+ Add …"; add a root unit at the bottom; move a unit by dragging; rename one; deactivate one | The tree updates; a deactivated unit is shown faded. |
| A-03 | Settings → Policies: create a policy for a new country with "+ New policy" (the country list includes every country) | The policy is listed. A second policy for the same type, country and employment type shows a warning. |
| A-04 | Edit a policy from a past date | A recalculation entry is queued and a request reaches the bell; Preview shows the people affected. |
| A-05 | Settings → Pay periods: generate periods for a country and year; delete the upcoming ones with "Delete N upcoming" | Past periods are not deleted; a confirmation dialog appears. |
| A-06 | Settings → Holidays: "Copy from previous year", fix a date, Activate | The holidays are active; those days are not counted in time off requests. |
| A-07 | Settings → Users & roles: add someone to a role and remove them; Data retention; Audit log | The change shows in the Audit log. |
| A-08 | Reports → My reports: save the "Scheduled time off" report and Share it with Deniz | It appears in Deniz's My reports with "Owner: Ayşe"; Can doesn't see it. When Ayşe deletes it, it disappears for Deniz too. |
| A-09 | Reports → Terminations, Salary changes, New hires | All offices; filters and exports work. |
| A-10 | Home → add a company link in the Links widget | It shows on everyone's home page. |

---

## 5. Cross-role scenarios

| # | Scenario | Expected |
|---|---|---|
| X-01 | Can requests → Deniz approves → Can cancels the approved future request before it starts | The balance comes back; the days leave the calendar. |
| X-02 | Can tries to cancel leave that has already started | Refused: "ask HR after that". Mert (HR, Istanbul) can cancel it. |
| X-03 | Can cannot approve his own request; Deniz cannot approve his own | Your own request never reaches your approval list; a request from someone without a manager goes to the HR of their office. |
| X-04 | Who's out and Team availability | Approved leave is shown; another person's leave **type** and note are visible only to authorised people. |

---

## 6. Exit criteria

UAT is complete when:

- every step is ✅, or a decision has been made on each ⚠️;
- every ❌ has been fixed and the step passed again;
- an HR admin and an HR manager have signed off that it can go live.

---

## 7. Short check after a platform upgrade (developer)

When Wyndbase is upgraded (a few minutes each):

1. Open the home page as Ayşe; no 400/500 in the browser console or network tab.
2. The Time Off, Reports, Settings and People pages open.
3. `bunx wyndbase pull` → if the types changed, run the build and the tests.
4. Send a test request and cancel it (Zz Demo).
