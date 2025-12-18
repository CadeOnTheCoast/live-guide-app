1) Import spec

A. Files and locations

All CSVs live under a single directory, for example:
	•	data/import/bcss/Projects.csv
	•	data/import/bcss/People.csv
	•	data/import/bcss/Objectives.csv
	•	data/import/bcss/KeyResults.csv
	•	data/import/bcss/Milestones.csv
	•	data/import/prichard/prichard_projects.csv
	•	data/import/prichard/prichard_people.csv
	•	data/import/prichard/prichard_objectives.csv
	•	data/import/prichard/prichard_key_results.csv
	•	data/import/prichard/prichard_milestones.csv
	•	data/import/hog-bayou/... (Projects, People, CurrentObjective, KeyResults, Milestones)
	•	data/import/toxics/Projects.csv
	•	data/import/toxics/People.csv
	•	data/import/toxics/CurrentObjective.csv
	•	data/import/toxics/KeyResults.csv
	•	data/import/toxics/Pushes.csv
	•	data/import/toxics/Milestones.csv
	•	data/import/toxics/DecisionMakers.csv
	•	data/import/toxics/PressureSources.csv
	•	data/import/toxics/Opponents.csv
	•	data/import/toxics/CommsPlan.csv
	•	data/import/toxics/Budget.csv
	•	data/import/toxics/StaffAllocation.csv
	•	data/import/mud-dumping/Projects.csv
	•	data/import/mud-dumping/People.csv
	•	data/import/mud-dumping/CurrentObjective.csv
	•	data/import/mud-dumping/KeyResults.csv
	•	data/import/mud-dumping/Pushes.csv
	•	data/import/mud-dumping/Milestones.csv
	•	data/import/mud-dumping/DecisionMakers.csv
	•	data/import/mud-dumping/PressureSources.csv
	•	data/import/mud-dumping/Opponents.csv
	•	data/import/mud-dumping/CommsPlan.csv
	•	data/import/oyster-planting/Projects.csv
	•	data/import/oyster-planting/People.csv
	•	data/import/oyster-planting/CurrentObjective.csv
	•	data/import/oyster-planting/KeyResults.csv
	•	data/import/oyster-planting/Milestones.csv
	•	data/import/oyster-hatchery/Projects.csv
	•	data/import/oyster-hatchery/People.csv
	•	data/import/oyster-hatchery/CurrentObjective.csv
	•	data/import/oyster-hatchery/KeyResults.csv
	•	data/import/oyster-hatchery/Milestones.csv
	•	data/import/oyster-hatchery/Pressure_DecisionMakers.csv
	•	data/import/oyster-hatchery/PressureSources.csv
	•	data/import/oyster-hatchery/Opponents.csv
	•	data/import/oyster-hatchery/CommsPlan.csv
	•	data/import/oyster-hatchery/Budget.csv
	•	data/import/oyster-hatchery/StaffAllocation.csv

(Exact paths are flexible; Codex task should either glob by pattern or work off a simple config list.)

B. Shared concepts and keys

Assumptions that should match your Prisma schema:
	•	Project:
	•	Key: slug (from project_slug)
	•	Fields: name, status, startDate, primaryOwnerId (via primary_owner_email), shortDescription, caseForChangeSummary, caseForChangeLink, defaultDepartmentId (via default_department_code)
	•	Person:
	•	Key: email
	•	Fields: name, departmentId (via department_code), role (enum/string: ADMIN/EDITOR/VIEWER)
	•	Objective (current objective only, no history):
	•	Composite key: (projectId, title) where title is objective_title
	•	Fields: description, timeframeStart, timeframeEnd, status
	•	KeyResult:
	•	Composite key: (projectId, objectiveTitle, code) where code is kr_code
	•	Fields: title, description, targetValue, unit, currentValue, status, ownerId (via owner_email), departmentId (via department_code), dueDate
	•	Milestone:
	•	Composite key: (projectId, order) where order is milestone_order
	•	Fields: title, description, dueDate, dueQuarter, departmentId (via department_code), pushNumber, isCritical, status
	•	Push:
	•	Composite key: (projectId, pushNumber)
	•	Fields: label (push_label), startDate, endDate, highLevelWorkSummary
	•	“Pressure box” tables:
	•	DecisionMaker: key = (projectId, decision_maker_id)
	•	PressureSource: references DecisionMaker via decision_maker_id
	•	Opponent: key = (projectId, opponent_name)
	•	CommsPlanEntry:
	•	One row per planned comms action, key = (projectId, pushNumber, channel, plannedDate)
	•	BudgetItem:
	•	Key = (projectId, fiscal_year, category)
	•	StaffAllocation:
	•	Key = (personId, projectId)

Any model names/fields that are off from your actual Prisma schema should be adjusted in code, but the CSV → concept mapping above should hold.

C. Type and enum expectations

For CSV parsing:
	•	Dates:
	•	YYYY-MM-DD (e.g. 2025-03-31) parse to Date.
	•	Missing dates: store as null.
	•	Quarters:
	•	e.g. Q3 2025 or "Q1 2026", stored as string on the model (no parsing needed).
	•	Status-like fields:
	•	Project.status: e.g. ACTIVE, PLANNING.
	•	Objective.objective_status: ON_TRACK, AT_RISK, etc.
	•	KeyResult.status: color/status codes like GREEN, YELLOW, RED.
	•	Milestone.status: NOT_STARTED, IN_PROGRESS, DONE.
	•	Script should:
	•	Uppercase trimmed value.
	•	If value is non-empty and not in the enum, log a warning and either:
	•	fall back to a safe default (NOT_STARTED for milestones, ON_TRACK for objectives, etc.), or
	•	throw if you want strictness. (Codex task will specify: log and continue.)
	•	Booleans:
	•	is_critical: accept TRUE/FALSE (case-insensitive), or true/false.
	•	Numbers:
	•	target_value, current_value, weight, amount, allocation_percent etc. should be parsed as number if non-empty; if parse fails, log warning and set null.
	•	Relationships:
	•	project_slug must map to an existing or newly created Project.
	•	department_code looks up a Department (seeded elsewhere). If not found:
	•	log warning and set departmentId = null.
	•	owner_email and primary_owner_email look up Person by email:
	•	If person does not exist yet, create them with name from People CSV if available, departmentId from department_code if present, otherwise null, and role default EDITOR or from the CSV.
	•	If email is blank or TBD, skip linking and log a warning.

D. Upsert rules (very concrete)

For each CSV type, the script should:
	•	Projects:
	•	For each row:
	•	Find existing Project by slug = project_slug.
	•	If found, update all non-null fields from CSV.
	•	If not found, create it.
	•	People:
	•	For each row:
	•	If email is missing/TBD, skip and warn.
	•	Else upsert Person by email and set name, department, role.
	•	Objectives / CurrentObjective:
	•	Resolve project by project_slug.
	•	Upsert by projectId + objective_title.
	•	KeyResults:
	•	Resolve project and objective (by objective_title + projectId).
	•	Upsert by projectId + objective_title + kr_code.
	•	Milestones:
	•	Resolve project.
	•	Upsert by projectId + milestone_order.
	•	Pushes:
	•	Resolve project.
	•	Upsert by projectId + push_number.
	•	DecisionMakers / PressureSources / Opponents:
	•	Resolve project.
	•	DecisionMaker: upsert by (projectId, decision_maker_id).
	•	PressureSource: upsert by (projectId, decision_maker_id, actor_name, source_type).
	•	Opponent: upsert by (projectId, opponent_name).
	•	CommsPlan:
	•	Resolve project.
	•	Upsert by (projectId, push_number (if present), channel, planned_date).
	•	Budget:
	•	Resolve project.
	•	Upsert by (projectId, fiscal_year, category).
	•	StaffAllocation:
	•	Resolve person by person_email and project by project_slug.
	•	Upsert by (personId, projectId).

E. Known data issues to handle / flag

The script should explicitly log these if they appear as-is:
	1.	Prichard KR cleanup
	•	KR1 spill reduction:
	•	Use 500000 (0.5M gallons/year) as target_value.
	•	If any older CSV still has 5000000 or similar, log that it is being overridden to 500000 based on corrected spec.
	•	KR2 due date:
	•	Use 2027-12-31 for “$10M by 2027”.
	•	If you see due_date 2025-12-31 for that row, log that you corrected it to 2027-12-31.
	2.	Missing or placeholder emails
	•	TBD or empty emails (e.g., Chloe Ray in BCSS; “Treasure” in Toxics; some hatchery rows with blank department_code or email) should be:
	•	Skipped for person creation or owner linking.
	•	Logged as warnings with row context.
	3.	Column-count alignment for some rows
	•	Toxics Projects row: ensure the line has exactly 9 data columns (one for each header) and that default_department_code holds something like PM (or is blank) instead of swallowing the case_for_change_link URL.
	•	Oyster Hatchery Projects.csv: ensure:
	•	case_for_change_link holds the Canva URL.
	•	default_department_code is a code like PM or left blank, but not the URL.
	•	If the script detects extra columns relative to the header, it should:
	•	Log a clear warning showing the raw line and the extra columns.
	•	Ignore extra trailing columns.
	4.	Missing required references
	•	Any row where project_slug does not correspond to a Project in Projects.csv:
	•	Log and skip.
	•	Any row referencing an unknown department_code:
	•	Log and proceed with departmentId = null.