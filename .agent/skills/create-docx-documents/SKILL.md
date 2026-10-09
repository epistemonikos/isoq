---
description: Guide for creating and generating Word (.docx) documents using docx.js
---

# Skill: Create DocX Documents

## Purpose

This skill guides you through creating Word documents (.docx) using the `docx` library (docx.js). It covers document structure, styling, tables, headers, paragraphs, and best practices for generating professional Word documents in the browser or Node.js.

## When to Use This Skill

- Generating Word documents for export functionality
- Creating reports, summaries, or documentation in .docx format
- Building complex documents with tables, headers, and formatting
- Implementing document download features
- Converting web content to Word format

## Library Overview

**docx.js** is a powerful library for generating .docx files with JavaScript/TypeScript. It works in both browser and Node.js environments.

**Installation:**

```bash
npm install docx --save
```

**Key Features:**

- Declarative API
- Full TypeScript support
- Works in browser and Node.js
- Supports paragraphs, tables, images, headers, footers
- Rich formatting options
- No external dependencies

## Core Concepts

### Document Structure

A Word document in docx.js consists of:

```
Document
└── Sections (one or more)
    ├── Properties (margins, orientation, etc.)
    └── Children (content)
        ├── Paragraphs
        ├── Tables
        ├── Images
        └── Other elements
```

### Basic Imports

```javascript
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  BorderStyle,
  PageOrientation,
  HeightRule,
  TableLayoutType,
  Packer,
} from "docx";
```

## Step-by-Step: Create a Simple Document

### Step 1: Create Basic Document

```javascript
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";

// Create document
const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Hello World",
              bold: true,
              size: 28, // Size in half-points (28 = 14pt)
            }),
          ],
        }),
      ],
    },
  ],
});

// Generate and download
Packer.toBlob(doc).then((blob) => {
  saveAs(blob, "example.docx");
});
```

### Step 2: Add Headers and Paragraphs

```javascript
const doc = new Document({
  sections: [
    {
      children: [
        // Heading 1
        new Paragraph({
          text: "Document Title",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),

        // Heading 2
        new Paragraph({
          text: "Section Title",
          heading: HeadingLevel.HEADING_2,
        }),

        // Regular paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: "This is a regular paragraph with ",
              size: 24,
            }),
            new TextRun({
              text: "bold text",
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: " and ",
              size: 24,
            }),
            new TextRun({
              text: "italic text",
              italics: true,
              size: 24,
            }),
          ],
        }),

        // Empty paragraph for spacing
        new Paragraph(""),
      ],
    },
  ],
});
```

### Step 3: Create Tables

```javascript
const table = new Table({
  width: {
    size: 100,
    type: WidthType.PERCENTAGE,
  },
  rows: [
    // Header row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ text: "Name", bold: true })],
          shading: { fill: "DDDDDD" },
        }),
        new TableCell({
          children: [new Paragraph({ text: "Value", bold: true })],
          shading: { fill: "DDDDDD" },
        }),
      ],
    }),

    // Data rows
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Item 1")],
        }),
        new TableCell({
          children: [new Paragraph("100")],
        }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Item 2")],
        }),
        new TableCell({
          children: [new Paragraph("200")],
        }),
      ],
    }),
  ],
});

// Add to document
const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          text: "Data Table",
          heading: HeadingLevel.HEADING_2,
        }),
        table,
      ],
    },
  ],
});
```

## Using the WordDocumentBuilder Pattern

For complex documents, use a builder pattern (as seen in `wordDocumentBuilder.js`):

### Step 1: Create Builder Class

```javascript
export class WordDocumentBuilder {
  constructor(options = {}) {
    this.sections = [];
    this.currentSection = null;
    this.options = {
      defaultFontSize: 24, // 12pt
      defaultFont: "Times New Roman",
      margins: {
        top: 720, // 0.5 inch
        right: 720,
        bottom: 720,
        left: 720,
      },
      ...options,
    };
  }

  startSection(config = {}) {
    this.currentSection = {
      properties: {
        margins: config.margins || this.options.margins,
        page: config.page || {},
      },
      children: [],
    };

    if (config.orientation === "landscape") {
      this.currentSection.properties.page = {
        orientation: PageOrientation.LANDSCAPE,
      };
    }

    return this;
  }

  endSection() {
    if (this.currentSection) {
      this.sections.push(this.currentSection);
      this.currentSection = null;
    }
    return this;
  }

  addHeader(text, level = 1, options = {}) {
    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
    };

    const paragraph = new Paragraph({
      heading: headingLevels[level] || HeadingLevel.HEADING_2,
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: text,
          bold: options.bold !== false,
          size: options.size || 32,
          font: { name: options.font || this.options.defaultFont },
        }),
      ],
    });

    this.addToCurrentSection(paragraph);
    return this;
  }

  addParagraph(text, options = {}) {
    const paragraph = new Paragraph({
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: text,
          bold: options.bold || false,
          size: options.size || this.options.defaultFontSize,
          font: { name: options.font || this.options.defaultFont },
        }),
      ],
    });

    this.addToCurrentSection(paragraph);
    return this;
  }

  addSpacing() {
    this.addToCurrentSection(new Paragraph(""));
    return this;
  }

  addTable(rows, headers, options = {}) {
    const tableRows = [
      this.createTableHeaderRow(headers),
      ...this.createTableDataRows(rows),
    ];

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    this.addToCurrentSection(table);
    return this;
  }

  createTableHeaderRow(headers) {
    return new TableRow({
      tableHeader: true,
      children: headers.map(
        (header) =>
          new TableCell({
            shading: { fill: "DDDDDD" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: header.text || header,
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
          })
      ),
    });
  }

  createTableDataRows(rows) {
    return rows.map(
      (rowData) =>
        new TableRow({
          children: rowData.map(
            (cellText) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: String(cellText),
                        size: 22,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    );
  }

  addToCurrentSection(content) {
    if (!this.currentSection) {
      this.startSection();
    }
    this.currentSection.children.push(content);
  }

  build() {
    // Finalize current section
    if (this.currentSection) {
      this.endSection();
    }

    return new Document({
      sections: this.sections.map((section) => ({
        properties: section.properties,
        children: section.children,
      })),
    });
  }

  reset() {
    this.sections = [];
    this.currentSection = null;
    return this;
  }
}
```

### Step 2: Use Builder Pattern

```javascript
import { WordDocumentBuilder } from "@/utils/wordDocumentBuilder";
import { Packer } from "docx";
import { saveAs } from "file-saver";

// Create document using builder
const builder = new WordDocumentBuilder();

builder
  .startSection()
  .addHeader("Project Report", 1)
  .addSpacing()
  .addParagraph("This is the project description.")
  .addSpacing()
  .addHeader("Data Summary", 2)
  .addTable(
    [
      ["Finding 1", "High confidence", "10"],
      ["Finding 2", "Moderate confidence", "8"],
      ["Finding 3", "Low confidence", "5"],
    ],
    [{ text: "Finding" }, { text: "Assessment" }, { text: "References" }]
  )
  .endSection();

const doc = builder.build();

// Generate and download
Packer.toBlob(doc).then((blob) => {
  saveAs(blob, "report.docx");
});
```

## Common Patterns

### Pattern 1: Multi-Section Document

```javascript
const doc = new Document({
  sections: [
    // Portrait section
    {
      properties: {
        page: {
          orientation: PageOrientation.PORTRAIT,
        },
      },
      children: [
        new Paragraph({
          text: "Portrait Section",
          heading: HeadingLevel.HEADING_1,
        }),
      ],
    },

    // Landscape section
    {
      properties: {
        page: {
          orientation: PageOrientation.LANDSCAPE,
        },
      },
      children: [
        new Paragraph({
          text: "Landscape Section",
          heading: HeadingLevel.HEADING_1,
        }),
      ],
    },
  ],
});
```

### Pattern 2: Complex Table with Styling

```javascript
const table = new Table({
  width: {
    size: 100,
    type: WidthType.PERCENTAGE,
  },
  layout: TableLayoutType.FIXED,
  borders: {
    top: { size: 1, color: "000000", style: BorderStyle.SINGLE },
    bottom: { size: 1, color: "000000", style: BorderStyle.SINGLE },
    left: { size: 1, color: "000000", style: BorderStyle.SINGLE },
    right: { size: 1, color: "000000", style: BorderStyle.SINGLE },
    insideHorizontal: { size: 1, color: "000000", style: BorderStyle.SINGLE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({
      height: { height: 500, rule: HeightRule.EXACT },
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: "EEEEEE" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Header 1",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Content")],
        }),
      ],
    }),
  ],
});
```

### Pattern 3: Text Formatting

```javascript
new Paragraph({
  children: [
    new TextRun({
      text: "Normal text ",
      size: 24,
    }),
    new TextRun({
      text: "bold text ",
      bold: true,
      size: 24,
    }),
    new TextRun({
      text: "italic text ",
      italics: true,
      size: 24,
    }),
    new TextRun({
      text: "underlined text ",
      underline: {},
      size: 24,
    }),
    new TextRun({
      text: "colored text",
      color: "FF0000", // Red
      size: 24,
    }),
  ],
});
```

### Pattern 4: Export in Vue Component

```vue
<template>
  <div>
    <b-button @click="exportToWord" :disabled="exporting">
      <font-awesome-icon icon="file-word" />
      {{ exporting ? "Generating..." : "Export to Word" }}
    </b-button>
  </div>
</template>

<script>
import { WordDocumentBuilder } from "@/utils/wordDocumentBuilder";
import { Packer } from "docx";
import { saveAs } from "file-saver";

export default {
  data() {
    return {
      exporting: false,
    };
  },
  methods: {
    async exportToWord() {
      this.exporting = true;

      try {
        const builder = new WordDocumentBuilder();

        builder
          .startSection()
          .addHeader(this.project.name, 1)
          .addSpacing()
          .addParagraph(this.project.description)
          .addSpacing()
          .addTable(this.formatDataForTable(), this.tableHeaders)
          .endSection();

        const doc = builder.build();

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${this.project.name}.docx`);

        this.$bvToast.toast("Document generated successfully", {
          title: "Export Complete",
          variant: "success",
        });
      } catch (error) {
        console.error("Export error:", error);
        this.$bvToast.toast("Failed to generate document", {
          title: "Export Failed",
          variant: "danger",
        });
      } finally {
        this.exporting = false;
      }
    },

    formatDataForTable() {
      return this.items.map((item) => [item.name, item.value, item.status]);
    },
  },
};
</script>
```

### Pattern 5: Text Sanitization

Always sanitize user input before adding to document:

```javascript
import {
  sanitizeText,
  sanitizeWithLimit,
  safeText,
} from "@/utils/textSanitizer";

// Safe text handling
const sanitizedText = sanitizeWithLimit(
  safeText(userInput),
  5000, // Max length
  {
    preserveNewlines: true,
    preserveEmojis: false,
  }
);

builder.addParagraph(sanitizedText);
```

## Size Reference

Font sizes in docx.js are in **half-points**:

| Points | Half-Points | Usage               |
| ------ | ----------- | ------------------- |
| 10pt   | 20          | Small text          |
| 11pt   | 22          | Table cells         |
| 12pt   | 24          | Body text (default) |
| 14pt   | 28          | Heading 3           |
| 16pt   | 32          | Heading 2           |
| 18pt   | 36          | Heading 1           |
| 20pt   | 40          | Large headings      |

Margins are in **twips** (1/20 of a point):

| Inches | Twips |
| ------ | ----- |
| 0.5"   | 720   |
| 0.75"  | 1080  |
| 1.0"   | 1440  |

## Generating the Document

### Browser (with file-saver)

```javascript
import { Packer } from "docx";
import { saveAs } from "file-saver";

// Generate blob and download
Packer.toBlob(doc).then((blob) => {
  saveAs(blob, "document.docx");
});
```

### Node.js

```javascript
import { Packer } from "docx";
import * as fs from "fs";

// Generate buffer and save
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("document.docx", buffer);
});
```

### As Base64

```javascript
import { Packer } from "docx";

// Generate base64 string
Packer.toBase64String(doc).then((base64) => {
  // Send to server or use as data URL
  console.log(base64);
});
```

## Best Practices

### 1. Use Builder Pattern for Complex Documents

```javascript
// ✅ Good - Readable and maintainable
const builder = new WordDocumentBuilder();
builder
  .startSection()
  .addHeader("Title", 1)
  .addParagraph("Content")
  .endSection();

// ❌ Bad - Hard to read
const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ text: "Title", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Content" }),
      ],
    },
  ],
});
```

### 2. Always Sanitize User Input

```javascript
// ✅ Good - Sanitized
builder.addParagraph(sanitizeText(userInput));

// ❌ Bad - Unsanitized
builder.addParagraph(userInput);
```

### 3. Handle Errors Gracefully

```javascript
// ✅ Good - Error handling
try {
  const doc = builder.build();
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "document.docx");
} catch (error) {
  console.error("Document generation failed:", error);
  this.$bvToast.toast("Failed to generate document", {
    variant: "danger",
  });
}
```

### 4. Use Consistent Styling

```javascript
// ✅ Good - Consistent options
const builder = new WordDocumentBuilder({
  defaultFontSize: 24,
  defaultFont: "Times New Roman",
});

// All paragraphs will use these defaults
builder.addParagraph("Text 1");
builder.addParagraph("Text 2");
```

### 5. Optimize for Large Documents

```javascript
// ✅ Good - Process in chunks
const chunkSize = 100;
for (let i = 0; i < data.length; i += chunkSize) {
  const chunk = data.slice(i, i + chunkSize);
  chunk.forEach((item) => {
    builder.addParagraph(item.text);
  });
}

// ❌ Bad - All at once (may freeze browser)
data.forEach((item) => {
  builder.addParagraph(item.text);
});
```

## Common Pitfalls

1. **Font Size Confusion**: Remember sizes are in half-points (24 = 12pt)
2. **Missing Sections**: Always wrap content in sections
3. **Table Width**: Use `WidthType.PERCENTAGE` for responsive tables
4. **Empty Paragraphs**: Use `new Paragraph('')` for spacing, not `\n`
5. **Text Sanitization**: Always sanitize user input to avoid XML errors
6. **Memory Issues**: For large documents, generate in chunks
7. **Async Operations**: Remember `Packer.toBlob()` returns a Promise

## Testing Checklist

- [ ] Document generates without errors
- [ ] File downloads correctly
- [ ] Content displays properly in Microsoft Word
- [ ] Content displays properly in Google Docs
- [ ] Content displays properly in LibreOffice
- [ ] Tables render correctly
- [ ] Formatting is preserved
- [ ] Special characters are handled
- [ ] Large documents don't freeze browser
- [ ] Error handling works correctly

## Related Files

- `src/utils/wordDocumentBuilder.js` - Builder class implementation
- `src/utils/textSanitizer.js` - Text sanitization utilities
- `src/services/wordExportService.js` - Export service
- `src/strategies/exportStrategies.js` - Export strategies

## See Also

- Official Documentation: https://docx.js.org/
- API Reference: https://docx.js.org/api/
- GitHub Repository: https://github.com/dolanmiu/docx
- Examples: https://github.com/dolanmiu/docx/tree/master/demo
- Playground: https://docxjs-editor.vercel.app/

## Quick Reference

### Common Imports

```javascript
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  BorderStyle,
  PageOrientation,
  Packer,
} from "docx";
```

### Minimal Example

```javascript
import { Document, Paragraph, Packer } from "docx";
import { saveAs } from "file-saver";

const doc = new Document({
  sections: [
    {
      children: [new Paragraph("Hello World")],
    },
  ],
});

Packer.toBlob(doc).then((blob) => {
  saveAs(blob, "example.docx");
});
```
