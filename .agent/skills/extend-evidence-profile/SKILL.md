---
description: Guide for extending the Evidence Profile with new GRADE-CERQual components
---

# Skill: Extend Evidence Profile

## Purpose

This skill guides you through adding new components to the Evidence Profile (GRADE-CERQual assessment), modifying existing components, or changing the assessment options.

## When to Use This Skill

- GRADE-CERQual methodology adds new assessment criteria
- Project requires custom assessment components
- Need to modify existing component options or labels
- Changing the scoring system (e.g., adding more granular options)

## Current Evidence Profile Structure

The Evidence Profile consists of 5 components:

1. **Methodological Limitations** (4 options: 0-3)
2. **Coherence** (4 options: 0-3)
3. **Adequacy** (4 options: 0-3)
4. **Relevance** (4 options: 0-3)
5. **CERQual Assessment** (4 options: 0-3)

Each component has:

- `option`: Number (0-3) representing the selected level
- `explanation`: String with detailed justification
- `notes`: Optional additional notes

## Critical Files to Modify

### Frontend Components

1. **`src/components/list/evidenceProfileForm.vue`**

   - Lines 27-386: Component-specific forms (left panel)
   - Lines 388-714: Component-specific data displays (right panel)
   - Purpose: Modal form for editing Evidence Profile

2. **`src/components/list/editList.vue`**

   - Purpose: Worksheet view that displays Evidence Profile
   - What to update: Display logic for new components

3. **`src/components/project/viewProject.vue`**
   - Location: `createFinding()` method (lines 1410-1455)
   - Purpose: Initialize Evidence Profile structure when creating finding
   - What to update: Add new component to initial structure

### Backend

4. **`isoq_server/auth_server/controllers/core.py`**
   - Location: `checkIfAListHasCerqual()` (lines 871-881)
   - Purpose: Validate Evidence Profile completeness
   - What to update: Add validation for new component if required

### Translation Files

5. **`src/lang/en.json`**, **`src/lang/es.json`**, **`src/lang/pt.json`**
   - Sections to update:
     - `worksheet.questions.*` - Question text
     - `worksheet.options.*` - Option labels
     - `worksheet.tooltips.*` - Tooltip explanations
     - `worksheet.domains.*` - Domain names

## Step-by-Step Procedure

### Adding a New Evidence Profile Component

**Example: Adding a "Transferability" component**

#### Step 1: Add to Initial Structure

```javascript
// src/components/project/viewProject.vue - createFinding() method
evidence_profile: {
  name: listName,
  isoqf_id: this.lastId,
  relevance: { explanation: '', option: null },
  adequacy: { explanation: '', option: null },
  coherence: { explanation: '', option: null },
  methodological_limitations: { explanation: '', option: null },
  cerqual: { explanation: '', option: null },
  transferability: { explanation: '', option: null }  // NEW
}
```

#### Step 2: Add Form Section

```vue
<!-- src/components/list/evidenceProfileForm.vue -->
<!-- Add after relevance section (around line 309) -->
<div
  id="left-transferability"
  v-if="selectedOptions.type === 'transferability'"
>
  <p class="font-weight-bold">
    {{ $t('worksheet.questions.transferability') }}
  </p>
  <p class="font-weight-light">
    {{ $t('worksheet.reminders.transferability') }}
  </p>
  
  <b-form-radio-group 
    v-model="selectedOptions.transferability.option" 
    name="transferability" 
    stacked 
    :disabled="!permission">
    <b-form-radio value="0">
      {{ $t('worksheet.options.no_concerns') }}
      <small v-b-tooltip.hover :title="$t('worksheet.tooltips.transferability.no_concerns')">*</small>
    </b-form-radio>
    <b-form-radio value="1">
      {{ $t('worksheet.options.minor_concerns') }}
      <small v-b-tooltip.hover :title="$t('worksheet.tooltips.transferability.minor_concerns')">*</small>
    </b-form-radio>
    <b-form-radio value="2">
      {{ $t('worksheet.options.moderate_concerns') }}
      <small v-b-tooltip.hover :title="$t('worksheet.tooltips.transferability.moderate_concerns')">*</small>
    </b-form-radio>
    <b-form-radio value="3">
      {{ $t('worksheet.options.serious_concerns') }}
      <small v-b-tooltip.hover :title="$t('worksheet.tooltips.transferability.serious_concerns')">*</small>
    </b-form-radio>
  </b-form-radio-group>
  
  <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
    <a @click="clearMySelection('transferability')" 
       v-if="selectedOptions.transferability.option !== null">
      <font-awesome-icon icon="trash"></font-awesome-icon>
      {{ $t('worksheet.actions.clear_selection') }}
    </a>
  </p>
  
  <b-form-group 
    v-if="selectedOptions.transferability.option !== null" 
    class="mt-4 font-weight-light" 
    label-for="input-transferability-explanation">
    <template slot="label">
      <p class="font-weight-bold">
        {{ showMessage(selectedOptions.transferability.option, 'transferability') }}
      </p>
    </template>
    <template slot="description">
      {{ $t('worksheet.labels.explanation_required') }}
    </template>
    <b-form-textarea 
      id="input-transferability-explanation" 
      v-model="selectedOptions.transferability.explanation" 
      rows="6" 
      max-rows="100" 
      :disabled="!permission">
    </b-form-textarea>
  </b-form-group>
  
  <b-form-group 
    class="mt-2 font-weight-light" 
    label-for="input-transferability-notes"
    :description="$t('worksheet.labels.notes_description')">
    <template slot="label">
      <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
    </template>
    <b-form-textarea 
      id="input-transferability-notes" 
      v-model="selectedOptions.transferability.notes" 
      rows="6" 
      max-rows="100" 
      :disabled="!permission">
    </b-form-textarea>
  </b-form-group>
</div>
```

#### Step 3: Add Right Panel Display

```vue
<!-- src/components/list/evidenceProfileForm.vue -->
<!-- Add display section for the new component -->
<div v-if="selectedOptions.type === 'transferability'">
  <edit-review-finding 
    @update-list-data="getList(true)" 
    :list="list" 
    :finding="findings" 
    :permission="permission">
  </edit-review-finding>
  <!-- Add any relevant data tables here -->
</div>
```

#### Step 4: Update CERQual Summary Display

```vue
<!-- src/components/list/evidenceProfileForm.vue -->
<!-- In the CERQual component assessments tab (around line 667) -->
<b-tab :title="$t('worksheet.titles.component_assessments')">
  <!-- Existing components... -->
  
  <h5>{{ $t('worksheet.domains.transferability') }}</h5>
  <p>
    <b>{{ displaySelectedOption(evidenceProfile[0].transferability.option) }}</b>
    <template v-if="parseInt(evidenceProfile[0].transferability.option) > 0">
      <br />
      {{ $t('common.explanation_colon') }}
      <span v-if="evidenceProfile[0].transferability.explanation">
        {{ getExplanation('transferability', evidenceProfile[0].transferability.option, evidenceProfile[0].transferability.explanation) }}
      </span>
      <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
    </template>
  </p>
</b-tab>
```

#### Step 5: Add Component Data Property

```javascript
// src/components/list/evidenceProfileForm.vue - data() section
selectedOptions: {
  type: null,
  title: null,
  methodological_limitations: { option: null, explanation: '', notes: '' },
  coherence: { option: null, explanation: '', notes: '' },
  adequacy: { option: null, explanation: '', notes: '' },
  relevance: { option: null, explanation: '', notes: '' },
  cerqual: { option: null, explanation: '', notes: '' },
  transferability: { option: null, explanation: '', notes: '' }  // NEW
}
```

#### Step 6: Add Translations

```json
// src/lang/en.json
{
  "worksheet": {
    "questions": {
      "transferability": "How transferable are the findings to other contexts?"
    },
    "reminders": {
      "transferability": "Consider the extent to which findings can be applied to other settings or populations."
    },
    "domains": {
      "transferability": "Transferability"
    },
    "tooltips": {
      "transferability": {
        "no_concerns": "Findings are highly transferable to other contexts",
        "minor_concerns": "Findings are mostly transferable with minor limitations",
        "moderate_concerns": "Findings have moderate transferability concerns",
        "serious_concerns": "Findings have serious transferability limitations"
      }
    }
  }
}
```

Repeat for `es.json` and `pt.json`.

#### Step 7: Update Backend Validation (Optional)

If the new component should be required for publication:

```python
# isoq_server/auth_server/controllers/core.py
def checkIfAListHasCerqual(project):
    cnt = 0
    lists = api.get('isoqf_lists?project_id=%s' % project)
    for list in lists:
        # Check if both cerqual AND transferability are complete
        if (list.get('cerqual').get('explanation') != '' and
            list.get('transferability').get('explanation') != ''):
            cnt += 1

    if (cnt):
        return json_cors_response({'status': True, 'message': 'Can Publish.'})
    else:
        return json_cors_response({
            'status': False,
            'message': 'The project must have complete GRADE-CERQual assessment including transferability.'
        })
```

### Modifying Existing Component Options

**Example: Adding a 5th option "Very Serious Concerns" to Methodological Limitations**

#### Step 1: Update Form Options

```vue
<!-- src/components/list/evidenceProfileForm.vue -->
<b-form-radio value="4">
  {{ $t('worksheet.options.very_serious_concerns') }}
  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.methodological_limitations.very_serious_concerns')">*</small>
</b-form-radio>
```

#### Step 2: Add Translation

```json
{
  "worksheet": {
    "options": {
      "very_serious_concerns": "Very serious concerns"
    },
    "tooltips": {
      "methodological_limitations": {
        "very_serious_concerns": "Critical methodological flaws that severely undermine confidence"
      }
    }
  }
}
```

#### Step 3: Update Display Logic

Ensure all display methods handle the new option value (4).

## Validation Checklist

After adding/modifying components:

- [ ] Initial structure updated in `createFinding()`
- [ ] Form section added in `evidenceProfileForm.vue` (left panel)
- [ ] Display section added in `evidenceProfileForm.vue` (right panel)
- [ ] CERQual summary updated to show new component
- [ ] Data properties added to `selectedOptions`
- [ ] Translations added in all 3 languages
- [ ] Backend validation updated (if required for publication)
- [ ] Tested creating a new finding → component appears
- [ ] Tested filling out the component → saves correctly
- [ ] Tested CERQual summary → shows new component
- [ ] Tested in all three languages
- [ ] No console errors

## Common Pitfalls

1. **Forgetting Initial Structure**: Must add to `createFinding()` or existing findings won't have the field
2. **Missing in CERQual Summary**: New components must be displayed in the CERQual assessment tab
3. **Data Property**: Must add to `selectedOptions` in data()
4. **Translation Keys**: Need translations for questions, options, tooltips, and domains
5. **Backend Compatibility**: Ensure backend can handle the new field structure

## Related Files

- `src/components/list/evidenceProfileForm.vue` - Main Evidence Profile form
- `src/components/list/editList.vue` - Worksheet view
- `src/components/project/viewProject.vue` - Finding creation
- `isoq_server/auth_server/controllers/core.py` - Backend validation
- `src/lang/*.json` - Translation files

## See Also

- CLAUDE.md section "Project Creation & Publication Flow" → "Worksheet: Completing the Evidence Profile"
- GRADE-CERQual official documentation: https://www.cerqual.org/
