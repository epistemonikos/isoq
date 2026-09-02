---
description: Guide for modifying project publication requirements and validation logic
---

# Skill: Modify Publication Requirements

## Purpose

This skill guides you through modifying the publication requirements for iSoQ projects, including adding/removing required fields, changing validation logic, and updating error messages.

## When to Use This Skill

- Adding new required fields for project publication
- Removing or making optional existing required fields
- Changing validation rules (e.g., minimum character lengths, email formats)
- Updating validation error messages
- Modifying backend publication checks

## Critical Files to Modify

### Frontend Validation

1. **`src/utils/project.js`**

   - Location: `Project.validations()` method (lines 20-103)
   - Purpose: Frontend validation of all required fields
   - What to update:
     - Add/remove field checks in the validation logic
     - Update error messages in `responses.state`
     - Modify the main error message (line 91)

2. **`src/components/organization/organizationForm.vue`**
   - Location: Form fields and validation state
   - Purpose: Display form fields and validation errors
   - What to update:
     - Add/remove form fields in template
     - Add/remove validation state properties (lines 320, 339)
     - Add/remove `b-form-invalid-feedback` components

### Backend Validation

3. **`isoq_server/auth_server/controllers/core.py`**
   - Location: `checkIfCanPublish()` function (lines 829-851)
   - Purpose: Backend validation before publication
   - What to update:
     - Add/remove validation check functions
     - Update validation error messages
4. **`isoq_server/auth_server/controllers/core.py`**
   - Location: `checkBasicInformation()` function (lines 904-936)
   - Purpose: Validate basic project information fields
   - What to update:
     - Add/remove fields in `only_check` array (line 906)
     - Update field validation logic

### Translation Files

5. **`src/lang/en.json`**, **`src/lang/es.json`**, **`src/lang/pt.json`**
   - Purpose: Internationalized error messages and labels
   - What to update:
     - Add translation keys for new fields under `project.*`
     - Add validation error messages under `project.validation.*`
     - Update in all three language files

## Step-by-Step Procedure

### Adding a New Required Field

**Example: Adding a required "funding_source" field**

#### Step 1: Add Frontend Validation

```javascript
// src/utils/project.js - Add to validations() method
// After line 81 (license check)
if (
  data.funding_source === "" ||
  data.funding_source === null ||
  data.funding_source === undefined
) {
  responses.state.funding_source = false;
  cnt++;
}
```

#### Step 2: Update Form Component

```vue
<!-- src/components/organization/organizationForm.vue -->
<!-- Add form field in template -->
<b-form-group
  :label="$t('project.funding_source')"
  label-for="input-project-funding-source"
>
  <b-form-input
    :disabled="!canEdit"
    id="input-project-funding-source"
    :state="state.funding_source"
    v-model="formData.funding_source">
  </b-form-input>
  <b-form-invalid-feedback :state="state.funding_source">
    {{ $t('project.validation.funding_source_required') }}
  </b-form-invalid-feedback>
</b-form-group>
```

#### Step 3: Add Validation State

```javascript
// src/components/organization/organizationForm.vue
// In data() - line 320
state: {
  // ... existing fields
  funding_source: null;
}
```

#### Step 4: Add Backend Validation

```python
# isoq_server/auth_server/controllers/core.py
# In checkBasicInformation() - line 906
only_check = ['id', 'name', 'authors', 'author', 'author_email',
              'review_question', 'complete_by_author', 'lists_authors',
              'funding_source']  # Add here
```

#### Step 5: Add Translations

```json
// src/lang/en.json
{
  "project": {
    "funding_source": "Funding Source",
    "validation": {
      "funding_source_required": "Funding source is required for publication"
    }
  }
}
```

Repeat for `es.json` and `pt.json`.

#### Step 6: Test

1. Create a new project without the field → Should show validation error
2. Fill the field → Validation should pass
3. Try to publish without the field → Should be blocked
4. Test in all three languages

### Removing a Required Field

**Example: Making "url_doi" optional**

#### Step 1: Remove Frontend Validation

```javascript
// src/utils/project.js
// Comment out or remove lines 68-71
// if (data.published_status && (data.url_doi === '' || ...)) {
//   responses.state.url_doi = false
//   cnt++
// }
```

#### Step 2: Update Form (Optional)

If you want to keep the field but make it optional, just remove the validation feedback.

#### Step 3: Remove Backend Validation

```python
# isoq_server/auth_server/controllers/core.py
# Remove 'url_doi' from only_check array if present
```

#### Step 4: Update Translations

Update validation messages to indicate the field is now optional.

### Changing Validation Rules

**Example: Change review_question minimum length from 3 to 10 characters**

#### Step 1: Update Frontend Validation

```javascript
// src/utils/project.js - line 63
if (
  data.review_question === "" ||
  data.review_question === null ||
  data.review_question === undefined ||
  data.review_question.trim().length < 10
) {
  responses.state.review_question = false;
  cnt++;
}
```

#### Step 2: Update Backend Validation

```python
# isoq_server/auth_server/controllers/core.py - line 930
if key == 'review_question' and len(value) <= 9:  # Changed from 2 to 9
    response[key] = 'txt corto'
```

#### Step 3: Update Error Messages

```json
// src/lang/en.json
{
  "project": {
    "validation": {
      "review_question_min_length": "Review question must be at least 10 characters"
    }
  }
}
```

## Validation Checklist

After making changes, verify:

- [ ] Frontend validation updated in `project.js`
- [ ] Form component updated in `organizationForm.vue`
- [ ] Validation state properties added/removed
- [ ] Backend validation updated in `core.py`
- [ ] Translation keys added in all 3 language files (en, es, pt)
- [ ] Error messages are clear and helpful
- [ ] Tested creating a project without the field
- [ ] Tested publishing with/without the field
- [ ] Tested in all three languages
- [ ] No console errors or warnings
- [ ] Backend returns appropriate error messages

## Common Pitfalls

1. **Forgetting Backend Validation**: Always update both frontend AND backend
2. **Missing Translations**: Must update all 3 language files
3. **Validation State**: Don't forget to add state properties in organizationForm.vue
4. **Conditional Fields**: Remember fields like `lists_authors` that depend on other fields
5. **Error Messages**: Make sure error messages are user-friendly and actionable

## Related Files

- `src/utils/project.js` - Frontend validation logic
- `src/components/organization/organizationForm.vue` - Project properties form
- `src/components/project/propertiesProject.vue` - Wrapper component
- `isoq_server/auth_server/controllers/core.py` - Backend validation
- `src/lang/*.json` - Translation files

## See Also

- CLAUDE.md section "Project Creation & Publication Flow" → "Required Fields for Publication"
- CLAUDE.md section "Project Creation & Publication Flow" → "Publication Requirements"
