# Org verification (2026-11-20)
- [x] org_tree_three_roots: PASS — org.roots → Departments, Offices, Product Teams (Ruling: roots split into org.roots)
- [x] unit_unique_per_team: PASS — second org.units for same team → CONSTRAINT_VIOLATION "This team is already in use."
- [x] deactivate_keeps_history: PASS — after deactivateUnit from 2026-12-01: plain read status=active; org.tree {at:'2026-12-02'} status=inactive
