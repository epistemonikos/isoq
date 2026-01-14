# iSoQ Web - AI Agent Guide

## Project Overview

**Interactive Summary of Qualitative Findings (iSoQ)** - A Vue.js 2 application for creating and managing interactive summaries of qualitative research findings using the GRADE-CERQual approach. Built for the Epistemonikos Foundation.

**Tech Stack:** Vue 2.6, Vuex, Vue Router, Bootstrap-Vue, Webpack 4, Axios
**Node Version:** >= 14.0.0

## Architecture

### Component Organization

Components are organized by feature domain:

- `src/components/project/` - Core iSoQ project management (ViewTable.vue, viewProject.vue, UploadReferences.vue)
- `src/components/list/` - Worksheet/list editing (editList.vue, evidenceProfileForm.vue)
- `src/components/organization/` - Workspace management
- `src/components/previewContent/` - Public preview views (previewContentSoQf.vue, previewContentWorksheet.vue)
- `src/components/tableActions/` - Reusable table components (ActionTable.vue, Filters.vue)
- `src/components/charsOfStudies/`, `methAssessments/` - Domain-specific data display

### State Management

Single Vuex store at `src/store.js`:

- **Authentication state:** User login status, permissions (`can_write_other_orgs`, `is_owner`)
- **Key actions:** `login`, `logout`, `getLogginInfo` (checks auth on route navigation)
- **Auth persistence:** Uses cookies (session-based), token stored in `localStorage` as `l_s`
- Promise-based login check stored in `state.promise` for route guard synchronization

### Routing

- **Mode:** Hash-based routing (`mode: 'hash'`)
- **Auth guard:** `beforeEach` calls `getLogginInfo`, checks `meta.requiresAuth`
- **Route naming:** Routes use camelCase names (e.g., `viewProject`, `editList`)
- **Key routes:**
  - `/workspace/:org_id/isoqf/:id` → Project view
  - `/worksheet/:id/edit` → Worksheet editor
  - `/preview/isoq/:org_id/:isoqf_id/:token` → Public preview
- **Title handling:** Routes set `document.title` via `meta.title`

### API Communication

Custom API wrapper at `src/utils/Api.js`:
\`\`\`javascript
import Api from '@/utils/Api'
Api.get('/path', params)
Api.post('/path', data)
Api.put('/path', data)
Api.delete('/path')
\`\`\`

- **Base URL:** Set via `process.env.API_URL`
- **Auth:** Token from `localStorage.getItem('l_s')` → Header: `Authorization: Token session="..."`
- **Alternative:** Direct axios calls for auth endpoints (`/auth/login`, `/auth/logout`)

### Internationalization (i18n)

- Plugin at `src/plugins/i18n.js` using vue-i18n
- Locale files: `src/lang/en.json`
- Default locale: `en`
- Usage in components: `$t('key')` or `{{ $t('key') }}`
- Route translation helper: `$i18nRoute` (Trans plugin)

## Development Workflow

### Local Development Setup

**IMPORTANT:** Full-stack development requires starting multiple services in order:

1. **Start Database (Docker)**
   \`\`\`bash

   # Launch Docker container with database

   docker compose up # or docker-compose up
   \`\`\`

2. **Start Backend Server**
   \`\`\`bash
   cd ~/dev/epistemonikos/isoq_server
   conda activate isoq-server

   # Run backend server command (typically runs on port 8080)

   \`\`\`

3. **Start Frontend (this repository)**
   \`\`\`bash
   cd ~/dev/epistemonikos/isoq_web
   nvm use isoq
   npm run dev # or npm start
   \`\`\`

4. **Access Application**
   - URL: `http://episte.lo:8090`
   - Test user credentials: Ask a team member for dev credentials

### Starting Development Server

\`\`\`bash
npm run dev

# Or explicitly:

npm start
\`\`\`

- **Dev server:** Runs on `http://episte.lo:8090` (or next available port)
- **Backend dependency:** Frontend proxies API calls to `http://localhost:8080` (backend must be running)
- **Proxy setup:** All API endpoints (`/auth`, `/api`, `/users`, `/organizations`, `/project`) proxy to backend
- **Hot reload:** Enabled via webpack-dev-server
- **DNS requirement:** `episte.lo` must resolve to localhost (add to `/etc/hosts` if needed)

### Building for Production

\`\`\`bash
npm run build
\`\`\`

- **Output:** `dist/` directory
- **Asset path:** Relative (`assetsPublicPath: './'`)
- **Source maps:** Disabled in production (`productionSourceMap: false`)
- **No gzip** by default

### Deployment

Manual deployment process:

1. Ensure `master` branch is up to date with desired changes
2. SSH into production server
3. Pull latest code from `master` branch
4. Run deployment script/commands on server
5. No automated CI/CD pipeline currently configured

### Code Quality

\`\`\`bash
npm run lint
\`\`\`

- **Linter:** ESLint with `babel-eslint` parser
- **Style guide:** Standard JS + Vue Essential rules
- **Currently disabled** in build process (`useEslint: false` in config)
- Debugger statements allowed in development

### No Testing Framework

No test files or test runner configured. If adding tests, you'll need to set up Jest or similar.

## Key Patterns & Conventions

### Component Loading

Lazy loading with webpack chunks for route components:
\`\`\`javascript
const MainPage = () => import(/_ webpackChunkName: "home" _/ '@/components/MainPage')
\`\`\`

### Data Validation

Project publishing requires validation via `src/utils/project.js`:

- Email validation: `Project.validEmail(email)`
- URL validation: `Project.validUrl(url)`
- Full validation: `Project.validations(data)` checks required fields for public projects
- Returns structured error state for form field highlighting

### Bootstrap-Vue Usage

Heavy use of Bootstrap-Vue components:

- Tables: `<b-table>` with filters, sorting, pagination
- Modals: `<b-modal>` for dialogs
- Forms: `<b-form-input>`, `<b-form-select>`, etc.
- Layout: `<b-container>`, `<b-row>`, `<b-col>`
- See `ViewTable.vue` for typical table patterns with dropdown filters

### FontAwesome Icons

Icons added to library in `src/main.js`:
\`\`\`javascript
import { faEdit, faCopy, faTrash, ... } from '@fortawesome/free-solid-svg-icons'
library.add(faEdit, faCopy, ...)
\`\`\`
Usage: `<font-awesome-icon icon="edit" />`

## Project Creation & Publication Flow

### Overview

iSoQ projects follow a structured workflow from creation to publication. A project must complete specific steps and meet validation requirements before it can be published to the iSoQ database.

### Data Model Hierarchy

```
isoqf_projects (Project)
├── isoqf_references (References)
├── isoqf_list_categories (Categories)
├── isoqf_lists (Lists/Findings)
│   └── isoqf_findings (Finding data)
│       └── isoqf_extracted_data (Extracted data per reference)
├── isoqf_characteristics (Step 3 data)
└── isoqf_assessments (Step 4 data)
```

### Project Types

Projects can be configured as **Camelot** or **non-Camelot** (controlled by `use_camelot` boolean field):

- **Camelot projects**: Use predefined Camelot fields in Steps 3-4 plus optional custom fields
- **Non-Camelot projects**: Use only custom fields defined by the user in Steps 3-4

### Step-by-Step Creation Workflow

#### Initial Setup: Project Properties

**Component:** `viewProject.vue` → `propertiesProject.vue` → `organizationForm.vue`

**Required Fields for Publication:**

- `name` - Project title (min 3 characters)
- `authors` - List of authors
- `author` - Corresponding author name (min 3 characters)
- `author_email` - Valid email address
- `review_question` - Research question (min 3 characters)
- `license_type` - License selection (required for public projects)
- `complete_by_author` - Boolean indicating if completed by review authors
- `lists_authors` - Required if `complete_by_author` is false
- `published_status` - Boolean for publication status
- `url_doi` - Required if `published_status` is true (must be valid URL)

**Validation:** `src/utils/project.js` → `Project.validations()`

---

#### Step 1: References

**Component:** `src/components/project/UploadReferences.vue`  
**API Endpoint:** `/isoqf_references`

**Purpose:** Import references that will be analyzed in the review.

**Import Methods:**

1. **File Upload**: RIS, BibTeX, or other reference manager formats
2. **PubMed Import**: Direct import via PubMed IDs

**Critical Requirement:**

- **At least 1 reference is required** to proceed to Steps 2-4
- Without references, Steps 2-4 tabs are disabled
- References are required to create findings

**Reference Data Structure:**

```javascript
{
  id: string,
  project_id: string,
  organization: string,
  authors: string,
  title: string,
  year: string,
  // ... other bibliographic fields
}
```

---

#### Step 2: Inclusion/Exclusion Criteria

**Component:** `src/components/project/InclusionExclusionCriteria.vue`  
**API Endpoint:** `/isoqf_projects` (PATCH)

**Purpose:** Define criteria for including/excluding studies.

**Fields:**

- `inclusion` - Inclusion criteria text
- `exclusion` - Exclusion criteria text

**Note:** These fields are used in the Evidence Profile's Relevance assessment.

---

#### Step 3: Characteristics of Studies

**Component (Camelot):** `src/components/camelot/StepThree.vue`  
**Component (non-Camelot):** `src/components/project/crudTables.vue`  
**API Endpoint:** `/isoqf_characteristics`

**Purpose:** Document study characteristics to support findings.

**Camelot Projects:**

- Predefined Camelot fields (e.g., "Meta domain 1 - Research", "Meta domain 2 - Intervention")
- Optional custom fields added by user
- Each reference must have Camelot fields completed

**Non-Camelot Projects:**

- User defines custom fields (e.g., "Country", "Participant Age", "Study Design")
- Each reference gets a row with these custom fields

**Data Structure:**

```javascript
{
  id: string,
  project_id: string,
  name: string,  // Field name
  items: [
    {
      ref_id: string,  // Reference ID
      column_0: string,  // Field value
      authors: string
    }
  ]
}
```

---

#### Step 4: Methodological Assessments

**Component (Camelot):** `src/components/camelot/StepFour.vue`  
**Component (non-Camelot):** `src/components/project/crudTables.vue`  
**API Endpoint:** `/isoqf_assessments`

**Purpose:** Assess methodological quality of studies.

**Camelot Projects:**

- Answer predefined methodological questions based on Step 3 data
- Questions evaluate research design, conduct, and analysis
- Responses inform the Evidence Profile's Methodological Limitations assessment

**Non-Camelot Projects:**

- Similar to Step 3: user defines custom assessment fields
- Each reference gets assessed on these custom criteria

**Data Structure:**

```javascript
{
  id: string,
  project_id: string,
  name: string,  // Assessment name
  items: [
    {
      ref_id: string,
      column_0: string,  // Assessment value
      authors: string
    }
  ]
}
```

---

#### Creating Findings (Review Findings)

**Component:** `src/components/project/viewProject.vue` → `createFinding()`  
**API Endpoints:** `/isoqf_lists` (List), `/isoqf_findings` (Finding)

**Terminology Note:** In the codebase, "lists" and "findings" are closely related:

- `isoqf_lists` - Container for a finding (has references, evidence profile)
- `isoqf_findings` - The actual finding data (linked to a list)

**Creation Flow:**

1. User creates a new finding (automatically creates both list and finding)
2. Finding is created with empty Evidence Profile structure
3. User assigns references to the finding
4. User completes Evidence Profile in Worksheet

**Initial Finding Structure:**

```javascript
{
  organization: string,
  list_id: string,
  name: string,
  evidence_profile: {
    methodological_limitations: { explanation: '', option: null },
    coherence: { explanation: '', option: null },
    adequacy: { explanation: '', option: null },
    relevance: { explanation: '', option: null },
    cerqual: { explanation: '', option: null }
  },
  references: []
}
```

---

#### Worksheet: Completing the Evidence Profile

**Component:** `src/components/list/editList.vue` + `evidenceProfileForm.vue`  
**Route:** `/worksheet/:id/edit`

**Purpose:** Complete the GRADE-CERQual assessment for each finding.

**Evidence Profile Components (all required for publication):**

1. **Methodological Limitations**

   - Options: No concerns (0), Minor (1), Moderate (2), Serious (3)
   - Requires explanation if concerns exist
   - Based on Step 4 methodological assessments

2. **Coherence**

   - Options: No concerns (0), Minor (1), Moderate (2), Serious (3)
   - Requires explanation if concerns exist
   - Assesses consistency across studies

3. **Adequacy**

   - Options: No concerns (0), Minor (1), Moderate (2), Serious (3)
   - Requires explanation if concerns exist
   - Assesses richness/depth of data

4. **Relevance**

   - Options: No concerns (0), Minor (1), Moderate (2), Serious (3)
   - Requires explanation
   - Assesses applicability to review question

5. **CERQual Assessment** (CRITICAL for publication)
   - Options: High (0), Moderate (1), Low (2), Very Low (3)
   - **Requires detailed explanation** - this is the most critical field
   - Synthesizes all four components above

**Extracted Data:**

- Each reference assigned to a finding must have extracted data
- Component: `editListExtractedData.vue`
- API: `/isoqf_extracted_data`
- Structure: One row per reference with qualitative data extracted

---

### Publication Requirements

#### Frontend Validation (`src/utils/project.js`)

Checks project metadata fields are complete (see "Required Fields for Publication" above).

#### Backend Validation (`/api/project/can_publish`)

Located in: `isoq_server/auth_server/controllers/core.py`

**Validation Checks:**

1. **`checkIfHaveReferences()`** - At least 1 reference exists in project
2. **`checkIfAListHasReferences()`** - At least 1 list has references assigned
3. **`checkIfAListHasCerqual()`** - At least 1 list has CERQual explanation completed

**Publication Criteria Summary:**

- ✅ All required project metadata fields completed
- ✅ At least 1 reference uploaded
- ✅ At least 1 finding created with references assigned
- ✅ At least 1 finding with complete Evidence Profile:
  - All 4 components assessed (methodological_limitations, coherence, adequacy, relevance)
  - CERQual assessment with explanation completed
- ✅ Extracted data for each reference in the finding
- ✅ Steps 3 & 4 completed (characteristics and assessments for references)

#### Publishing a Project

**Component:** `src/components/project/actionButtons.vue`  
**API Endpoint:** `/api/publish` (PATCH)

**Visibility Options:**

- `private` - Only visible to project collaborators
- `public` - Visible in iSoQ database
- `shareable` - Shareable via link

**Publication Process:**

1. User clicks "Publish" button
2. Frontend validates required fields (`Project.validations()`)
3. Backend validates publication requirements (`/api/project/can_publish`)
4. If validation passes, project visibility is updated
5. Permissions are propagated to all related entities (lists, findings, references, etc.)

---

### Key Components Reference

| Component                        | Purpose                        | Route/Location                  |
| -------------------------------- | ------------------------------ | ------------------------------- |
| `viewProject.vue`                | Main project view with 4 steps | `/workspace/:org_id/isoqf/:id`  |
| `propertiesProject.vue`          | Project metadata form          | Tab 0 in viewProject            |
| `UploadReferences.vue`           | Reference import               | Step 1 in viewProject           |
| `InclusionExclusionCriteria.vue` | Criteria definition            | Step 2 in viewProject           |
| `crudTables.vue`                 | Steps 3-4 (non-Camelot)        | Steps 3-4 in viewProject        |
| `StepThree.vue`                  | Step 3 (Camelot)               | Step 3 in viewProject (Camelot) |
| `StepFour.vue`                   | Step 4 (Camelot)               | Step 4 in viewProject (Camelot) |
| `editList.vue`                   | Worksheet/Evidence Profile     | `/worksheet/:id/edit`           |
| `evidenceProfileForm.vue`        | Evidence Profile modal         | Modal in editList               |
| `ViewTable.vue`                  | Project findings list          | Organization view               |
| `actionButtons.vue`              | Publish/share actions          | In viewProject                  |

### API Endpoints Reference

| Endpoint                           | Method | Purpose                           |
| ---------------------------------- | ------ | --------------------------------- |
| `/isoqf_projects`                  | POST   | Create project                    |
| `/isoqf_projects/:id`              | PATCH  | Update project                    |
| `/isoqf_references`                | POST   | Add references                    |
| `/isoqf_references?project_id=:id` | GET    | Get project references            |
| `/isoqf_characteristics`           | POST   | Add characteristic field          |
| `/isoqf_characteristics/:id`       | PATCH  | Update characteristic data        |
| `/isoqf_assessments`               | POST   | Add assessment field              |
| `/isoqf_assessments/:id`           | PATCH  | Update assessment data            |
| `/isoqf_lists`                     | POST   | Create finding/list               |
| `/isoqf_lists/:id`                 | PATCH  | Update list/evidence profile      |
| `/isoqf_findings`                  | POST   | Create finding data               |
| `/isoqf_findings/:id`              | PATCH  | Update finding                    |
| `/isoqf_extracted_data`            | POST   | Add extracted data                |
| `/isoqf_extracted_data/:id`        | PATCH  | Update extracted data             |
| `/api/project/can_publish`         | GET    | Validate publication requirements |
| `/api/publish`                     | PATCH  | Publish/unpublish project         |

### Styling

- Main styles: `src/assets/styles/main.scss`
- Per-component styles: `<style lang="scss">` blocks in .vue files
- Bootstrap 4.6.2 as base

## Common Gotchas

### Webpack Configuration

- Uses **Webpack 4** (not 5)
- Custom polyfills for Node globals (buffer, crypto, stream, process) configured in `build/webpack.base.conf.js`
- Root webpack.config.js is a compatibility wrapper for webpack-dev-server

### Authentication Flow

- Auth check happens **before every route** via `router.beforeEach`
- Promise-based: `store.state.promise` must resolve before navigation completes
- Login redirects preserve destination: `query: { redirect: to.fullPath }`
- No JWT tokens - session cookies with localStorage backup

### API Endpoints

All backend calls expect endpoints starting with:

- `/auth/*` - Authentication
- `/api/*` - Main API
- `/users/*` - User management
- `/organizations/*` - Workspace operations
- `/project/*` - Project operations

### Vue 2 Specifics

- Options API (not Composition API)
- No `<script setup>` syntax
- `this.$http` for axios (set in main.js)
- `this.$router` and `this.$store` available via plugins

## When Modifying Code

### Adding New Routes

1. Import component lazily in `src/router/index.js`
2. Add route object with `meta.title` and optionally `meta.requiresAuth`
3. Add translations if using i18n route helper

### Adding API Calls

Prefer using `Api` class from `src/utils/Api.js` over raw axios for authenticated requests.

### State Changes

All mutations must go through Vuex actions/mutations in `src/store.js`. Don't mutate `this.$store.state` directly.

### Component Creation

- Keep domain-specific components in appropriate subdirectories
- Use lazy loading for large components
- Follow existing patterns for Bootstrap-Vue usage

### CSS/Styling

Import main.scss in component: `@import '@/assets/styles/main.scss';` or add to `src/assets/styles/main.scss` for global styles.

## Project Structure Reference

\`\`\`
src/
├── assets/ # Images, styles (main.scss)
├── components/ # All Vue components (organized by domain)
├── constants/ # Constants (trans.js)
├── lang/ # i18n locale files (en.json)
├── plugins/ # Vue plugins (i18n, Translation)
├── router/ # Route definitions (index.js)
├── utils/ # Utilities (Api.js, project.js, commons.js)
├── App.vue # Root component
├── main.js # Entry point
└── store.js # Vuex store

build/ # Webpack configuration
config/ # Environment config (dev/prod)
static/ # Static assets (copied to dist as-is)
dist/ # Build output (gitignored)
\`\`\`

## Environment Variables

Set in `config/dev.env.js` and `config/prod.env.js`:

- `API_URL` - Backend API base URL
- Other environment-specific settings

## Git Workflow

- **Main branch:** `master`
- **Development branch:** `develop`
- Standard feature branch workflow with pull requests
- Recent commits show feature branches merged to develop, then to master
