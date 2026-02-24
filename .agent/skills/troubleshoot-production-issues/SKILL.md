---
description: Guide for diagnosing and resolving production issues in iSoQ projects
---

# Skill: Troubleshoot Production Issues

## Purpose

This skill provides systematic procedures for diagnosing and resolving common production issues in iSoQ, particularly those related to project publication, data integrity, and user-reported problems.

## When to Use This Skill

- User reports inability to publish a project
- Data appears missing or corrupted
- Validation errors are unclear
- References, findings, or extracted data not displaying
- Publication status inconsistencies
- Performance issues with large projects

## Common Production Issues

### Issue 1: Cannot Publish Project

**Symptoms:**

- "Publish" button disabled or shows error
- Validation error message appears
- Project stuck in "private" mode

**Diagnostic Steps:**

#### Step 1: Check Project Metadata

```javascript
// Check if all required fields are filled
Required fields:
- name (min 3 chars)
- authors (not empty)
- author (min 3 chars)
- author_email (valid email)
- review_question (min 3 chars)
- license_type (selected)
- complete_by_author OR lists_authors
- If published_status=true: url_doi (valid URL)
```

**Location:** Project Properties tab in `viewProject.vue`

#### Step 2: Check References

```javascript
// Verify at least 1 reference exists
GET /isoqf_references?project_id={project_id}
// Should return array with length > 0
```

**Common causes:**

- No references uploaded
- References deleted after findings created
- References not properly saved

**Fix:** Go to Step 1 (References) and upload/import references

#### Step 3: Check Findings with References

```javascript
// Verify at least 1 finding has references assigned
GET /isoqf_lists?project_id={project_id}
// Check each list: list.references.length > 0
```

**Common causes:**

- Finding created but no references assigned
- References removed from finding
- Finding deleted

**Fix:**

1. Go to organization view → project findings list
2. Click on finding
3. Assign references to the finding

#### Step 4: Check CERQual Completion

```javascript
// Verify at least 1 finding has CERQual explanation
GET /isoqf_lists?project_id={project_id}
// Check: list.cerqual.explanation !== ''
```

**Common causes:**

- CERQual assessment not completed
- Only option selected, no explanation written
- Explanation deleted

**Fix:**

1. Go to Worksheet for the finding
2. Click on CERQual assessment
3. Write detailed explanation (required!)

#### Step 5: Run Backend Validation

```javascript
// Call the validation endpoint directly
GET /api/project/can_publish?id={project_id}&workspace={org_id}
```

**Possible error messages:**

- "You need at least one reference loaded" → Go to Step 2
- "You need at least one reference assigned to a review finding" → Go to Step 3
- "You need to have at least one review finding with a complete GRADE-CERQual assessment" → Go to Step 4
- "Your request to publish has been denied because information is missing" → Go to Step 1

### Issue 2: Missing or Corrupted Data

**Symptoms:**

- References show in Step 1 but not in Worksheet
- Findings appear empty
- Extracted data missing
- Characteristics or assessments not displaying

**Diagnostic Steps:**

#### Step 1: Verify Data Existence

```javascript
// Check if data actually exists in database
GET /isoqf_references?project_id={project_id}
GET /isoqf_lists?project_id={project_id}
GET /isoqf_findings?list_id={list_id}
GET /isoqf_characteristics?project_id={project_id}
GET /isoqf_assessments?project_id={project_id}
GET /isoqf_extracted_data?finding_id={finding_id}
```

#### Step 2: Check Data Relationships

```javascript
// Verify IDs match correctly
Reference IDs in finding.references should exist in isoqf_references
Finding.list_id should match a list in isoqf_lists
Extracted data finding_id should match finding.id
```

**Common causes:**

- References deleted but still referenced in findings
- Finding deleted but list remains
- Mismatched IDs after data migration

**Fix:**

- If references missing: Re-upload references
- If relationships broken: May need database cleanup script
- If IDs mismatched: Contact backend developer

#### Step 3: Check Permissions

```javascript
// Verify user has access to the data
User must be:
- Owner of the organization, OR
- In project.can_write array, OR
- In project.can_read array (read-only)
```

**Location:** Check in `isoq_server/auth_server/controllers/core.py` → `@secure` decorator

### Issue 3: Validation Errors Are Unclear

**Symptoms:**

- Error message doesn't specify which field is missing
- Multiple validation errors at once
- Error message in wrong language

**Diagnostic Steps:**

#### Step 1: Check Frontend Validation State

```javascript
// In browser console while on Project Properties
// Check validation state object
this.$refs.organizationForm.state;
// Will show which fields are invalid (false values)
```

#### Step 2: Check Translation Keys

```javascript
// Verify translation keys exist
// In browser console:
this.$t("project.validation.field_name");
// Should return translated message, not the key itself
```

**Common causes:**

- Translation key missing in language file
- Wrong language file loaded
- Validation state not properly set

**Fix:**

1. Add missing translation keys to `src/lang/*.json`
2. Ensure all 3 language files have the key
3. Clear browser cache and reload

#### Step 3: Check Backend Error Messages

```javascript
// Backend errors come from core.py
// Check the response in Network tab (DevTools)
// Look for 'message' field in response
```

**Common causes:**

- Backend returns generic error
- Frontend doesn't display backend message
- Error message not internationalized

**Fix:**

- Update error messages in `core.py`
- Ensure frontend displays `response.data.message`

### Issue 4: Performance Issues

**Symptoms:**

- Slow loading of projects with many references
- Worksheet takes long to open
- Browser freezes when editing large tables

**Diagnostic Steps:**

#### Step 1: Check Data Volume

```javascript
// Count items in project
References: GET /isoqf_references?project_id={id} → .length
Findings: GET /isoqf_lists?project_id={id} → .length
Characteristics: GET /isoqf_characteristics?project_id={id} → .length
Assessments: GET /isoqf_assessments?project_id={id} → .length
```

**Thresholds:**

- \> 100 references: May cause slowness
- \> 50 findings: Worksheet may be slow
- \> 1000 characteristic items: Table rendering slow

#### Step 2: Check Network Requests

```javascript
// In DevTools Network tab, check:
- Number of API calls on page load
- Size of responses (MB)
- Time to first byte (TTFB)
```

**Common causes:**

- N+1 query problem (multiple API calls)
- Large payload sizes
- No pagination on tables

**Fix:**

- Implement pagination for large tables
- Add loading indicators
- Consider lazy loading for large datasets

#### Step 3: Check Browser Console

```javascript
// Look for warnings about:
- Large arrays being rendered
- Memory leaks
- Infinite loops in watchers
```

**Fix:**

- Add virtual scrolling for large tables
- Optimize Vue watchers
- Use `v-show` instead of `v-if` for frequently toggled elements

## Quick Diagnostic Checklist

When user reports an issue, run through this checklist:

### Publication Issues

- [ ] All required project fields filled?
- [ ] At least 1 reference exists?
- [ ] At least 1 finding has references?
- [ ] At least 1 finding has CERQual explanation?
- [ ] User is project owner or has write access?
- [ ] Project not locked by another user?

### Data Display Issues

- [ ] Data exists in database (check API)?
- [ ] IDs match correctly (references, findings, etc.)?
- [ ] User has permission to view data?
- [ ] No console errors in browser?
- [ ] Translation keys exist for all languages?

### Performance Issues

- [ ] How many references/findings in project?
- [ ] Network requests reasonable (\< 10 on load)?
- [ ] Response sizes reasonable (\< 1MB)?
- [ ] Browser console shows no memory warnings?

## Common Error Messages and Solutions

| Error Message                                                                           | Cause                                 | Solution                                       |
| --------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| "You need at least one reference loaded"                                                | No references in project              | Upload references in Step 1                    |
| "You need at least one reference assigned to a review finding"                          | Findings exist but have no references | Assign references to finding                   |
| "You need to have at least one review finding with a complete GRADE-CERQual assessment" | CERQual explanation missing           | Complete CERQual in Worksheet                  |
| "Your request to publish has been denied because information is missing"                | Required project fields missing       | Fill all required fields in Project Properties |
| "Cannot read properties of undefined"                                                   | Data structure mismatch               | Check if referenced data exists                |
| "Property or method is not defined"                                                     | Component error                       | Check browser console for details              |

## Tools and Resources

### Browser DevTools

- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls and responses
- **Vue DevTools**: Inspect component state and props

### API Testing

Use browser DevTools Network tab or tools like Postman to test:

```
GET /api/project/can_publish?id={project_id}&workspace={org_id}
GET /isoqf_projects/{project_id}
GET /isoqf_lists?project_id={project_id}
GET /isoqf_references?project_id={project_id}
```

### Database Queries

If you have database access:

```javascript
// Check project
db.isoqf_projects.findOne({ id: "project_id" });

// Check lists with CERQual
db.isoqf_lists.find({
  project_id: "project_id",
  "cerqual.explanation": { $ne: "" },
});

// Check references
db.isoqf_references.find({ project_id: "project_id" }).count();
```

## Escalation Path

If issue cannot be resolved:

1. **Collect Information:**

   - Project ID
   - Organization ID
   - User ID
   - Exact error message
   - Steps to reproduce
   - Browser console errors
   - Network tab screenshots

2. **Check Logs:**

   - Backend logs for API errors
   - Browser console for frontend errors

3. **Create Bug Report:**
   - Include all collected information
   - Specify environment (dev/staging/prod)
   - Tag with severity level

## Related Files

- `src/utils/project.js` - Frontend validation
- `src/components/organization/organizationForm.vue` - Project form
- `src/components/project/viewProject.vue` - Main project view
- `src/components/list/editList.vue` - Worksheet
- `isoq_server/auth_server/controllers/core.py` - Backend validation

## See Also

- CLAUDE.md section "Project Creation & Publication Flow" → "Publication Requirements"
- CLAUDE.md section "Common Gotchas"
- Skill: `modify-publication-requirements` - For changing validation logic
