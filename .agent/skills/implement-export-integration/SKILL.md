---
description: Guide for implementing export integrations to Google Sheets, Excel, and PowerPoint
---

# Skill: Implement Export Integration

## Purpose

This skill guides you through implementing export functionality to external formats like Google Sheets, Excel (xlsx), and PowerPoint (pptx) from the iSoQ frontend application.

## When to Use This Skill

- Adding Google Sheets export functionality
- Implementing Excel file generation
- Creating PowerPoint presentations from iSoQ data
- Adding new export formats to existing export features

## Export Architecture

### Frontend-Based Exports

All exports are implemented in the **frontend** because:

- No sensitive API keys needed (OAuth handles authentication)
- Direct browser-to-service communication
- No backend processing required
- Better user experience (immediate feedback)

### Export Flow

```
User clicks "Export" → Frontend formats data →
Authentication (if needed) → Generate/Upload file →
Show success/download link
```

## Implementation Options

### Option 1: Google Sheets Export (Recommended for Collaboration)

**Libraries:**

- `gapi-script` - Google API client
- Or direct `fetch()` calls to Google Sheets API

**Pros:**

- Real-time collaboration
- Automatic cloud storage
- Easy sharing
- No file size limits

**Cons:**

- Requires Google account
- OAuth authentication needed
- Internet connection required

### Option 2: Excel Export (Recommended for Offline)

**Libraries:**

- `xlsx` (SheetJS) - Most popular, free
- `exceljs` - More features, larger bundle

**Pros:**

- Works offline
- No authentication needed
- Universal format
- Immediate download

**Cons:**

- File size limits
- No collaboration features
- Manual sharing required

### Option 3: PowerPoint Export

**Libraries:**

- `pptxgenjs` - Generate PowerPoint presentations

**Pros:**

- Professional presentations
- Customizable layouts
- Works offline

**Cons:**

- More complex formatting
- Larger file sizes
- Limited interactivity

## Step-by-Step: Google Sheets Export

### Step 1: Install Dependencies

```bash
npm install gapi-script --save
```

### Step 2: Set Up Google OAuth

#### 2.1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized JavaScript origins: `http://episte.lo:8090`
6. Add authorized redirect URIs: `http://episte.lo:8090`
7. Copy Client ID

#### 2.2: Add Client ID to Environment

```javascript
// config/dev.env.js
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_URL: '"http://localhost:8080"',
  GOOGLE_CLIENT_ID: '"your-client-id-here.apps.googleusercontent.com"',
});
```

### Step 3: Create Google Sheets Service

```javascript
// src/services/googleSheetsService.js
import { gapi } from "gapi-script";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.GOOGLE_API_KEY; // Optional
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

class GoogleSheetsService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
  }

  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      gapi.load("client:auth2", async () => {
        try {
          await gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });

          this.isInitialized = true;
          this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signIn() {
    await this.init();
    if (!this.isSignedIn) {
      await gapi.auth2.getAuthInstance().signIn();
      this.isSignedIn = true;
    }
  }

  async signOut() {
    if (this.isSignedIn) {
      await gapi.auth2.getAuthInstance().signOut();
      this.isSignedIn = false;
    }
  }

  async createSpreadsheet(title, data) {
    await this.signIn();

    // Create spreadsheet
    const response = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title,
      },
    });

    const spreadsheetId = response.result.spreadsheetId;

    // Add data
    if (data && data.length > 0) {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "Sheet1!A1",
        valueInputOption: "RAW",
        resource: {
          values: data,
        },
      });
    }

    return {
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }

  async exportToExistingSheet(spreadsheetId, sheetName, data) {
    await this.signIn();

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      resource: {
        values: data,
      },
    });

    return {
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }
}

export default new GoogleSheetsService();
```

### Step 4: Format iSoQ Data for Export

```javascript
// src/utils/exportFormatters.js

export function formatProjectForExport(project, lists, references) {
  const data = [];

  // Header row
  data.push([
    "Project Title",
    "Authors",
    "Review Question",
    "Finding",
    "CERQual Assessment",
    "References",
  ]);

  // Data rows
  lists.forEach((list) => {
    const refs = list.references
      .map((refId) => {
        const ref = references.find((r) => r.id === refId);
        return ref ? `${ref.authors} (${ref.year})` : "";
      })
      .join("; ");

    data.push([
      project.name,
      project.authors,
      project.review_question,
      list.name,
      getCerqualLabel(list.cerqual.option),
      refs,
    ]);
  });

  return data;
}

export function formatEvidenceProfileForExport(list, evidenceProfile) {
  const data = [];

  // Title
  data.push([`Evidence Profile: ${list.name}`]);
  data.push([]); // Empty row

  // Components
  const components = [
    "Methodological Limitations",
    "Coherence",
    "Adequacy",
    "Relevance",
    "CERQual Assessment",
  ];

  const fields = [
    "methodological_limitations",
    "coherence",
    "adequacy",
    "relevance",
    "cerqual",
  ];

  data.push(["Component", "Assessment", "Explanation"]);

  fields.forEach((field, index) => {
    const component = evidenceProfile[field];
    data.push([
      components[index],
      getConcernLabel(component.option),
      component.explanation || "",
    ]);
  });

  return data;
}

function getCerqualLabel(option) {
  const labels = {
    0: "High confidence",
    1: "Moderate confidence",
    2: "Low confidence",
    3: "Very low confidence",
  };
  return labels[option] || "Not assessed";
}

function getConcernLabel(option) {
  const labels = {
    0: "No concerns",
    1: "Minor concerns",
    2: "Moderate concerns",
    3: "Serious concerns",
  };
  return labels[option] || "Not assessed";
}
```

### Step 5: Add Export Button to Component

```vue
<!-- src/components/project/actionButtons.vue -->
<template>
  <div>
    <!-- Existing buttons... -->

    <b-button
      variant="outline-primary"
      @click="exportToGoogleSheets"
      :disabled="exporting"
    >
      <font-awesome-icon icon="file-export" />
      {{ exporting ? "Exporting..." : "Export to Google Sheets" }}
    </b-button>
  </div>
</template>

<script>
import GoogleSheetsService from "@/services/googleSheetsService";
import { formatProjectForExport } from "@/utils/exportFormatters";

export default {
  data() {
    return {
      exporting: false,
    };
  },
  methods: {
    async exportToGoogleSheets() {
      this.exporting = true;

      try {
        // Format data
        const data = formatProjectForExport(
          this.project,
          this.lists,
          this.references
        );

        // Create spreadsheet
        const result = await GoogleSheetsService.createSpreadsheet(
          `iSoQ Export - ${this.project.name}`,
          data
        );

        // Show success message with link
        this.$bvToast.toast(`Spreadsheet created successfully!`, {
          title: "Export Complete",
          variant: "success",
          href: result.url,
          solid: true,
        });

        // Open in new tab
        window.open(result.url, "_blank");
      } catch (error) {
        console.error("Export error:", error);
        this.$bvToast.toast(
          error.message || "Failed to export to Google Sheets",
          {
            title: "Export Failed",
            variant: "danger",
            solid: true,
          }
        );
      } finally {
        this.exporting = false;
      }
    },
  },
};
</script>
```

## Step-by-Step: Excel Export

### Step 1: Install Dependencies

```bash
npm install xlsx --save
```

### Step 2: Create Excel Export Service

```javascript
// src/services/excelExportService.js
import * as XLSX from "xlsx";

class ExcelExportService {
  exportToExcel(data, filename) {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  exportMultipleSheets(sheets, filename) {
    // sheets = [{ name: 'Sheet1', data: [[...]] }, ...]
    const wb = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  exportWithFormatting(data, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Column A
      { wch: 20 }, // Column B
      { wch: 50 }, // Column C
      { wch: 20 }, // Column D
      { wch: 15 }, // Column E
      { wch: 40 }, // Column F
    ];

    // Bold header row
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

export default new ExcelExportService();
```

### Step 3: Add Excel Export Button

```vue
<b-button variant="outline-success" @click="exportToExcel">
  <font-awesome-icon icon="file-excel" />
  Export to Excel
</b-button>
```

```javascript
import ExcelExportService from '@/services/excelExportService'
import { formatProjectForExport } from '@/utils/exportFormatters'

methods: {
  exportToExcel() {
    const data = formatProjectForExport(
      this.project,
      this.lists,
      this.references
    )

    const filename = `iSoQ_${this.project.name}_${Date.now()}`
    ExcelExportService.exportToExcel(data, filename)

    this.$bvToast.toast('Excel file downloaded', {
      title: 'Export Complete',
      variant: 'success'
    })
  }
}
```

## Step-by-Step: PowerPoint Export

### Step 1: Install Dependencies

```bash
npm install pptxgenjs --save
```

### Step 2: Create PowerPoint Export Service

```javascript
// src/services/powerpointExportService.js
import pptxgen from "pptxgenjs";

class PowerPointExportService {
  exportToPowerPoint(project, lists, evidenceProfiles) {
    const pptx = new pptxgen();

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(project.name, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      align: "center",
    });
    titleSlide.addText(project.authors, {
      x: 0.5,
      y: 3,
      w: 9,
      h: 0.5,
      fontSize: 18,
      align: "center",
    });

    // Review question slide
    const questionSlide = pptx.addSlide();
    questionSlide.addText("Review Question", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 24,
      bold: true,
    });
    questionSlide.addText(project.review_question, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 2,
      fontSize: 16,
    });

    // Findings slides
    lists.forEach((list, index) => {
      const slide = pptx.addSlide();

      // Finding title
      slide.addText(`Finding ${index + 1}: ${list.name}`, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.5,
        fontSize: 20,
        bold: true,
      });

      // Evidence Profile table
      const ep = evidenceProfiles[index];
      const tableData = [
        ["Component", "Assessment"],
        [
          "Methodological Limitations",
          this.getConcernLabel(ep.methodological_limitations.option),
        ],
        ["Coherence", this.getConcernLabel(ep.coherence.option)],
        ["Adequacy", this.getConcernLabel(ep.adequacy.option)],
        ["Relevance", this.getConcernLabel(ep.relevance.option)],
        ["CERQual", this.getCerqualLabel(ep.cerqual.option)],
      ];

      slide.addTable(tableData, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 3,
        fontSize: 14,
        border: { pt: 1, color: "000000" },
        fill: { color: "F7F7F7" },
      });
    });

    // Save file
    pptx.writeFile({ fileName: `iSoQ_${project.name}.pptx` });
  }

  getConcernLabel(option) {
    const labels = {
      0: "No concerns",
      1: "Minor concerns",
      2: "Moderate concerns",
      3: "Serious concerns",
    };
    return labels[option] || "Not assessed";
  }

  getCerqualLabel(option) {
    const labels = {
      0: "High confidence",
      1: "Moderate confidence",
      2: "Low confidence",
      3: "Very low confidence",
    };
    return labels[option] || "Not assessed";
  }
}

export default new PowerPointExportService();
```

## Common Patterns

### Pattern 1: Export with Progress Indicator

```javascript
async exportWithProgress() {
  this.exportProgress = 0
  this.exporting = true

  try {
    // Step 1: Authenticate (25%)
    await GoogleSheetsService.signIn()
    this.exportProgress = 25

    // Step 2: Format data (50%)
    const data = formatProjectForExport(...)
    this.exportProgress = 50

    // Step 3: Create spreadsheet (75%)
    const result = await GoogleSheetsService.createSpreadsheet(...)
    this.exportProgress = 75

    // Step 4: Complete (100%)
    this.exportProgress = 100
    window.open(result.url, '_blank')

  } finally {
    this.exporting = false
    this.exportProgress = 0
  }
}
```

### Pattern 2: Export Multiple Formats

```javascript
async exportMultipleFormats() {
  const data = formatProjectForExport(...)

  // Parallel exports
  await Promise.all([
    ExcelExportService.exportToExcel(data, 'export'),
    GoogleSheetsService.createSpreadsheet('Export', data)
  ])
}
```

### Pattern 3: Scheduled/Batch Export

```javascript
async batchExportProjects(projectIds) {
  for (const projectId of projectIds) {
    const project = await this.loadProject(projectId)
    const data = formatProjectForExport(project, ...)
    await ExcelExportService.exportToExcel(data, project.name)

    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

## Testing Checklist

- [ ] Google OAuth flow works correctly
- [ ] User can sign in/out
- [ ] Spreadsheet created with correct data
- [ ] Excel file downloads successfully
- [ ] PowerPoint file generates correctly
- [ ] Data formatting is correct
- [ ] Special characters handled properly
- [ ] Large datasets don't crash browser
- [ ] Error messages are user-friendly
- [ ] Works in all supported browsers
- [ ] Offline mode handled gracefully (for Excel/PPT)

## Common Pitfalls

1. **OAuth Redirect Issues**: Ensure redirect URIs match exactly in Google Console
2. **CORS Errors**: Use official Google libraries, not direct fetch
3. **Large Datasets**: Consider pagination or chunking for >1000 rows
4. **Memory Issues**: Don't load all data at once, stream if possible
5. **Browser Compatibility**: Test xlsx library in all target browsers
6. **File Size Limits**: Excel has row limits (~1M rows), warn users

## Related Files

- `src/services/googleSheetsService.js` - Google Sheets integration
- `src/services/excelExportService.js` - Excel export
- `src/services/powerpointExportService.js` - PowerPoint export
- `src/utils/exportFormatters.js` - Data formatting utilities
- `src/components/project/actionButtons.vue` - Export buttons
- `config/dev.env.js` - Environment configuration

## See Also

- Google Sheets API: https://developers.google.com/sheets/api
- SheetJS (xlsx): https://docs.sheetjs.com/
- PptxGenJS: https://gitbrent.github.io/PptxGenJS/
