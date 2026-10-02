# Modification Checklist

Use this checklist when modifying publication requirements to ensure nothing is missed.

## Adding a New Required Field

- [ ] **Frontend Validation** (`src/utils/project.js`)

  - [ ] Add field check in `Project.validations()` method
  - [ ] Add field to `responses.state` object
  - [ ] Increment `cnt` if validation fails

- [ ] **Form Component** (`src/components/organization/organizationForm.vue`)

  - [ ] Add form field in template
  - [ ] Add validation state property in `data()`
  - [ ] Add `b-form-invalid-feedback` component
  - [ ] Bind field to `formData` with `v-model`

- [ ] **Backend Validation** (`isoq_server/auth_server/controllers/core.py`)

  - [ ] Add field to `only_check` array in `checkBasicInformation()`
  - [ ] Add field validation logic if needed

- [ ] **Translations** (all 3 files)

  - [ ] Add label in `project.*` section (`en.json`, `es.json`, `pt.json`)
  - [ ] Add validation message in `project.validation.*`
  - [ ] Add description if needed

- [ ] **Testing**
  - [ ] Test creating project without field → shows error
  - [ ] Test filling field → validation passes
  - [ ] Test publishing without field → blocked
  - [ ] Test in all 3 languages (EN, ES, PT)
  - [ ] Check browser console for errors

## Removing a Required Field

- [ ] **Frontend Validation** (`src/utils/project.js`)

  - [ ] Remove or comment out field check
  - [ ] Remove from `responses.state`

- [ ] **Form Component** (`src/components/organization/organizationForm.vue`)

  - [ ] Remove validation feedback (or make optional)
  - [ ] Remove validation state property (optional)

- [ ] **Backend Validation** (`isoq_server/auth_server/controllers/core.py`)

  - [ ] Remove field from `only_check` array

- [ ] **Translations**

  - [ ] Update validation messages to indicate optional
  - [ ] Or remove validation messages entirely

- [ ] **Testing**
  - [ ] Test creating project without field → no error
  - [ ] Test publishing without field → allowed
  - [ ] Test in all 3 languages

## Changing Validation Rules

- [ ] **Frontend Validation** (`src/utils/project.js`)

  - [ ] Update validation logic (e.g., min length, regex)

- [ ] **Backend Validation** (`isoq_server/auth_server/controllers/core.py`)

  - [ ] Update corresponding backend logic

- [ ] **Translations**

  - [ ] Update error messages to reflect new rules

- [ ] **Testing**
  - [ ] Test edge cases (exactly at limit, just below, just above)
  - [ ] Test with invalid data → shows error
  - [ ] Test with valid data → passes
  - [ ] Test in all 3 languages
