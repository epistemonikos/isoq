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
   docker compose up  # or docker-compose up
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
   npm run dev  # or npm start
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
const MainPage = () => import(/* webpackChunkName: "home" */ '@/components/MainPage')
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
├── assets/          # Images, styles (main.scss)
├── components/      # All Vue components (organized by domain)
├── constants/       # Constants (trans.js)
├── lang/            # i18n locale files (en.json)
├── plugins/         # Vue plugins (i18n, Translation)
├── router/          # Route definitions (index.js)
├── utils/           # Utilities (Api.js, project.js, commons.js)
├── App.vue          # Root component
├── main.js          # Entry point
└── store.js         # Vuex store

build/               # Webpack configuration
config/              # Environment config (dev/prod)
static/              # Static assets (copied to dist as-is)
dist/                # Build output (gitignored)
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
