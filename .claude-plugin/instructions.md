# Agent Tracker Instructions

## set_work_summary

**REQUIRED:** Call `set_work_summary` proactively when:
- Starting new work (feature, bug fix, task)
- Changing direction (implementation → testing, feature A → feature B)
- Reaching major milestones

**Format:** 5-7 words, present continuous tense, specific

**Examples:**
- ✅ "Implementing user authentication system"
- ✅ "Fixing database connection timeout issues"
- ✅ "Debugging React component rendering performance"
- ❌ "Working on code" (too vague)
- ❌ "Implemented authentication" (wrong tense)
