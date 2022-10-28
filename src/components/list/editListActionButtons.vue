<template>
  <div>
  <b-row
    v-if="mode==='view' && permission"
    class="d-print-none justify-content-end mb-2 pt-2">
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="exportButton"
          variant="outline-secondary"
          block
          @click="exportToWord()">
          Export to MS-Word
        </b-button>
    </b-col>
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="printButton"
          @click="print"
          variant="outline-info"
          block>
          Print or save as PDF
        </b-button>
    </b-col>
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="editButton"
          @click="changeMode"
          variant="primary"
          v-b-tooltip:editButton.top="'Click to edit'"
          block>
          Edit
        </b-button>
    </b-col>
  </b-row>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } from 'docx'

export default {
  name: 'editListActionsButtons',
  props: {
    mode: String,
    permission: Boolean,
    project: Object,
    evidenceProfile: Array,
    selectOptions: Array,
    levelConfidence: Array,
    references: Array,
    list: Object,
    characteristicStudies: Object,
    methodologicalAssessments: Object,
    extractedData: Object
  },
  methods: {
    changeMode: function () {
      this.$emit('changeMode')
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.selectOptions[option].text
      } else {
        return ''
      }
    },
    displayLevelConfidence: function (option) {
      if (option !== null) {
        return this.levelConfidence[option].text
      }
      return ''
    },
    exportToWord: function () {
      const filename = (this.project.name + ' - GRADE-CERQual Assessment Worksheet' || 'GRADE-CERQual Assessment Worksheet') + '.doc'
      const doc = new Document()

      doc.addSection({
        size: {
          orientation: PageOrientation.LANDSCAPE
        },
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: this.project.name,
                size: 24,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'GRADE-CERQual Assessment Worksheet',
                bold: true,
                size: 28,
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'Evidence Profile',
                bold: true,
                size: 24,
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Table({
            borders: {
              top: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '2%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '#',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '28%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Summarized Review Finding',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Methodological limitations',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Coherence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Adequacy',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Relevance',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'GRADE-CERQual assessment of confidence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'References',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidenceProfile[0].isoqf_id,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidenceProfile[0].name,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidenceProfile[0].methodological_limitations.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidenceProfile[0].methodological_limitations.explanation.length) ? this.evidenceProfile[0].methodological_limitations.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidenceProfile[0].coherence.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidenceProfile[0].coherence.explanation.length) ? this.evidenceProfile[0].coherence.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidenceProfile[0].adequacy.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidenceProfile[0].adequacy.explanation.length) ? this.evidenceProfile[0].adequacy.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidenceProfile[0].relevance.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidenceProfile[0].relevance.explanation.length) ? this.evidenceProfile[0].relevance.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displayLevelConfidence(this.evidenceProfile[0].cerqual.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidenceProfile[0].cerqual.explanation.length) ? this.evidenceProfile[0].cerqual.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      ...this.generateReferences()
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Characteristics of Studies',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.characteristicStudies))),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Methodological Assessments',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.methodologicalAssessments))),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Extracted Data',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.extractedData))),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: Object.prototype.hasOwnProperty.call(this.project, 'license_type') ? this.theLicense(this.project.license_type) : '',
                size: 20,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          })
        ]
      })

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
    },
    generateTable: function (data) {
      return new Table({
        borders: {
          top: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          bottom: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          left: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          right: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          insideHorizontal: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          insideVertical: {
            style: BorderStyle.NONE
          }
        },
        width: {
          size: '100%',
          type: WidthType.PERCENTAGE
        },
        rows: [
          this.generateHeaderRow(JSON.parse(JSON.stringify(data.fields))),
          ...this.generateBodyRow(JSON.parse(JSON.stringify(data.items)))
        ]
      })
    },
    generateHeaderRow: function (data) {
      return new TableRow({
        tableHeader: true,
        children: [
          ...this.generateCell(data)
        ]
      })
    },
    generateBodyRow: function (data) {
      return data.map((item) => {
        return new TableRow({
          children: [
            ...this.prepareBodyCell(item)
          ]
        })
      })
    },
    generateCell: function (data) {
      let headers = []
      for (let d of data) {
        if (d.key !== 'ref_id' && d.key !== 'actions') {
          headers.push(d)
        }
      }
      const length = headers.length
      const size = 100 / length
      return headers.map((content) => {
        return new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          width: {
            size: size.toString() + '%',
            type: WidthType.PERCENTAGE
          },
          children: [
            this.generateParagraph(content, true)
          ]
        })
      })
    },
    prepareBodyCell: function (data) {
      if (Object.prototype.hasOwnProperty.call(data, 'index')) {
        delete data.index
      }
      let arr = []
      const keys = Object.keys(data)
      let numbers = []
      for (let key of keys) {
        if (key !== 'ref_id' && key !== 'authors') {
          const newKey = parseInt(key.split('_')[1])
          numbers.push(newKey)
        }
      }
      const len = numbers.sort((a, b) => { return a - b }).slice(-1)[0]
      if (len !== undefined) {
        if (len) {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          for (var cnt = 0; cnt <= len; cnt++) {
            if (Object.prototype.hasOwnProperty.call(data, 'column_' + cnt.toString())) {
              arr.push(this.generateBodyCell(data['column_' + cnt.toString()], false, 20))
            }
          }
        } else {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          arr.push(this.generateBodyCell(data['column_0'], false, 20))
        }
      } else {
        arr.push(this.generateBodyCell(data.authors, true, 20))
        arr.push(this.generateBodyCell(' ', false, 20))
      }
      return arr
    },
    generateBodyCell: function (data, isBold, size) {
      return new TableCell({
        children: [
          this.generateParagraph(data, isBold, size)
        ]
      })
    },
    generateParagraph: function (data, isBold, size) {
      return new Paragraph({
        children: [
          this.generateText(data, isBold, size)
        ]
      })
    },
    generateText: function (data, isBold = false, size = 20) {
      if (Object.prototype.hasOwnProperty.call(data, 'label')) {
        return new TextRun({
          text: data.label,
          bold: isBold,
          size: size
        })
      } else {
        return new TextRun({
          text: data,
          bold: isBold,
          size: size
        })
      }
    },
    generateReferences: function () {
      const allReferences = JSON.parse(JSON.stringify(this.references))
      const listReferences = JSON.parse(JSON.stringify(this.list.references))
      let epReferences = []
      for (let reference of allReferences) {
        if (listReferences.indexOf(reference.id) !== -1) {
          epReferences.push(reference.content)
        }
      }
      let arr = []
      for (let epr of epReferences) {
        arr.push(new Paragraph({
          children: [
            new TextRun({
              text: epr,
              size: 16
            })
          ]
        })
        )
      }
      return arr
    },
    print: function () {
      window.print()
    }
  }
}
</script>

<style>

</style>
