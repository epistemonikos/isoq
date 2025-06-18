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
import { displayExplanation } from '../utils/commons'
import { camelotMixin } from '@/mixins/camelotMixin'

export default {
  name: 'editListActionsButtons',
  mixins: [camelotMixin],
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
    extractedData: Object,
    license: String
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
      const filename = (this.project.use_camelot ? 'CAMELOT - ' : '') + (this.project.name + ' - GRADE-CERQual Assessment Worksheet' || 'GRADE-CERQual Assessment Worksheet') + '.doc'
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
                            text: displayExplanation('methodological-limitations', this.evidenceProfile[0].methodological_limitations.option, this.evidenceProfile[0].methodological_limitations.explanation),
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
                            text: displayExplanation('coherence', this.evidenceProfile[0].coherence.option, this.evidenceProfile[0].coherence.explanation), // (this.evidenceProfile[0].coherence.explanation.length) ? this.evidenceProfile[0].coherence.explanation : '',
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
                            text: displayExplanation('adequacy', this.evidenceProfile[0].adequacy.option, this.evidenceProfile[0].adequacy.explanation), // (this.evidenceProfile[0].adequacy.explanation.length) ? this.evidenceProfile[0].adequacy.explanation : '',
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
                            text: displayExplanation('relevance', this.evidenceProfile[0].relevance.option, this.evidenceProfile[0].relevance.explanation), // (this.evidenceProfile[0].relevance.explanation.length) ? this.evidenceProfile[0].relevance.explanation : '',
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
          this.generateTable(JSON.parse(JSON.stringify(this.characteristicStudies)), 'characteristic_studies'),
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
          this.generateTable(JSON.parse(JSON.stringify(this.methodologicalAssessments)), 'isoqf_assessments'),
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
                text: Object.prototype.hasOwnProperty.call(this.project, 'license_type') ? this.license : '',
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
        // Liberar recursos
        doc = null;
        blob = null;
      })
    },
    generateTable: function (data, type='') {
      // Si es methodologicalAssessments, usar una estructura diferente

      if (type === 'characteristic_studies' && this.project.use_camelot) {
        return this.generateCharacteristicsTable(data);
      }

      if (type === 'isoqf_assessments' && this.project.use_camelot) {
        return this.generateMethodologicalTable(data);
      }

      // Para otros tipos de tablas, mantener la lógica existente
      return this.generateStandardTable(data);
    },
    generateCharacteristicsTable: function (data) {
      // Crear las filas de la tabla
      const rows = [];

      // Obtener y ordenar los campos personalizados
      const customFields = data.fields ? data.fields.filter(field => field.key.startsWith('column_')) : [];
      customFields.sort((a, b) => {
        const numA = parseInt(a.key.split('_')[1]);
        const numB = parseInt(b.key.split('_')[1]);
        return numA - numB;
      });

      // Primera fila de encabezado: Categorías con colspan 2
      const categoryHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          // Primera columna: Authors
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '15%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Author(s), Year',
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          }),
          // Columnas para campos personalizados
          ...customFields.map(field =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: {
                size: '10%',
                type: WidthType.PERCENTAGE
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: field.label || field.key,
                      bold: true,
                      size: 22
                    })
                  ]
                })
              ]
            })
          ),
          // Columnas para cada categoría CAMELOT con colspan 2
          ...this.camelot.categories.map(category =>
            new TableCell({
              columnSpan: 2,
              verticalAlign: VerticalAlign.CENTER,
              width: {
                size: '15%',
                type: WidthType.PERCENTAGE
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: category.label,
                      bold: true,
                      size: 22
                    })
                  ]
                })
              ]
            })
          )
        ]
      });
      rows.push(categoryHeaderRow);

      // Segunda fila de encabezado: Subtítulos Extracted Data y Concerns
      const subHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          // Celda vacía para alinear con Authors
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '',
                    size: 22
                  })
                ]
              })
            ]
          }),
          // Celdas vacías para campos personalizados
          ...customFields.map(() =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '',
                      size: 22
                    })
                  ]
                })
              ]
            })
          ),
          // Subtítulos para cada categoría
          ...this.camelot.categories.flatMap(category => [
            // Extracted Data
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Extracted data',
                      bold: true,
                      size: 20
                    })
                  ]
                })
              ]
            }),
            // Concerns
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Concerns',
                      bold: true,
                      size: 20
                    })
                  ]
                })
              ]
            })
          ])
        ]
      });
      rows.push(subHeaderRow);

      // Generar filas para cada item
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          const itemRow = new TableRow({
            children: [
              // Celda de autores
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: item.authors || '',
                        size: 20
                      })
                    ]
                  })
                ]
              }),
              // Celdas para campos personalizados
              ...customFields.map(field =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item[field.key] || '',
                          size: 20
                        })
                      ]
                    })
                  ]
                })
              ),
              // Celdas para cada categoría CAMELOT
              ...this.camelot.categories.flatMap(category => {
                const extractedDataKey = category.options[0].key;
                const concernsKey = category.options[1].key;

                return [
                  // Extracted Data
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item[extractedDataKey] || '',
                            size: 20
                          })
                        ]
                      })
                    ]
                  }),
                  // Concerns
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item[concernsKey] || '',
                            size: 20
                          })
                        ]
                      })
                    ]
                  })
                ];
              })
            ]
          });
          rows.push(itemRow);
        });
      }

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
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          }
        },
        width: {
          size: '100%',
          type: WidthType.PERCENTAGE
        },
        rows: rows
      });
    },
    generateStandardTable: function (data) {
      // Asegurarnos de que data.fields y data.items existan
      if (!data.fields) {
        data.fields = [];
      }
      if (!data.items) {
        data.items = [];
      }

      // Obtener los campos personalizados actuales
      const customFields = [...data.fields];

      // Crear una copia de data con los campos y items actualizados
      const updatedData = {
        ...data,
        fields: customFields,
        items: data.items
      };

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
          this.generateHeaderRow(JSON.parse(JSON.stringify(updatedData.fields))),
          ...this.generateBodyRow(JSON.parse(JSON.stringify(updatedData.items)))
        ]
      });
    },
    generateMethodologicalTable: function (data) {
      const rows = [];

      // Primera fila de encabezado: Grupos principales
      const mainHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          // Authors vacio
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '15%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '',
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          }),
          // Overall assessment vacio
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '15%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ''
                  })
                ]
              })
            ]
          }),
          // Research design (colspan 4)
          new TableCell({
            columnSpan: 4,
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '35%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Research design',
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          }),
          // Research conduct (colspan 4)
          new TableCell({
            columnSpan: 4,
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '35%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Research conduct',
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          }),
          // Researchers domain vacio
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '',
                  bold: true,
                  size: 22
                })
              ]
            })]
          })
        ]
      });
      rows.push(mainHeaderRow);

      // Segunda fila de encabezado: Subtítulos
      const subHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          // Authors
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Author(s), Year',
                  bold: true,
                  size: 22
                })
              ]
            })]
          }),
          // Overall assessment
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Overall assessment',
                  bold: true,
                  size: 22
                })
              ]
            })]
          }),
          // Research design columns
          ...['Research', 'Stakeholders', 'Researchers', 'Context'].map(label =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 20
                    })
                  ]
                })
              ]
            })
          ),
          // Research conduct columns
          ...['Research', 'Stakeholders', 'Researchers', 'Context'].map(label =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 20
                    })
                  ]
                })
              ]
            })
          ),
          //
          // Researchers domain
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Researchers domain',
                  bold: true,
                  size: 22
                })
              ]
            })]
          })
        ]
      });
      rows.push(subHeaderRow);

      // Filtrar items basados en las referencias
      const activeReferenceIds = this.list.references;
      const filteredItems = data.items ? data.items.filter(item => activeReferenceIds.includes(item.ref_id)) : [];

      // Generar filas para cada item filtrado
      if (filteredItems.length > 0) {
        filteredItems.forEach(item => {
          const itemRow = new TableRow({
            children: [
              // Authors
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: item.authors || '',
                        size: 20
                      })
                    ]
                  })
                ]
              }),
              // Overall assessment
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: this.getOptionText(item.stages?.[3]?.options[0].option) || '',
                        size: 20
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.stages?.[3]?.options[0].text || '',
                            size: 20
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              // Research design cells
              ...this.generateStageCells(item.stages?.[0]),
              // Research conduct cells
              ...this.generateStageCells(item.stages?.[1]),
              // Researchers domain
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: this.getOptionText(item.stages?.[2]?.options[0].option) || '',
                        size: 20
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.stages?.[2]?.options[0].text || '',
                            size: 20
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          });
          rows.push(itemRow);
        });
      }

      return new Table({
        borders: {
          top: { size: 1, color: '000000', style: BorderStyle.SINGLE },
          bottom: { size: 1, color: '000000', style: BorderStyle.SINGLE },
          left: { size: 1, color: '000000', style: BorderStyle.SINGLE },
          right: { size: 1, color: '000000', style: BorderStyle.SINGLE },
          insideHorizontal: { size: 1, color: '000000', style: BorderStyle.SINGLE },
          insideVertical: { size: 1, color: '000000', style: BorderStyle.SINGLE }
        },
        width: {
          size: '100%',
          type: WidthType.PERCENTAGE
        },
        rows: rows
      });
    },

    // Función auxiliar para generar las celdas de cada etapa
    generateStageCells: function(stage) {
      if (!stage || !stage.options) {
        return Array(4).fill(new TableCell({
          children: [new Paragraph('')]
        }));
      }

      return stage.options.map(option =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: this.getOptionText(option.option) || '',
                  size: 20
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: option.text || '',
                  size: 20
                })
              ]
            })
          ]
        })
      );
    },

    // Función auxiliar para obtener el texto de la opción
    getOptionText: function(option) {
      const optionsMap = {
        'A': 'No or minimal concern',
        'B': 'Minor concerns',
        'C': 'Moderate concerns',
        'D': 'Serious concerns',
        'E': 'Unclear'
      };
      return optionsMap[option] || option;
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

      // Separar las claves en tres categorías
      const columnKeys = [] // Para campos column_X
      const camelotKeys = [] // Para campos CAMELOT
      const specialKeys = ['ref_id', 'authors'] // Claves especiales

      // Clasificar las claves
      for (let key of keys) {
        if (key.startsWith('column_')) {
          columnKeys.push(key)
        } else if (this.camelot && this.camelot.fields &&
                   this.camelot.fields.some(field => field.key === key)) {
          camelotKeys.push(key)
        }
      }

      // Ordenar las claves column_X numéricamente
      columnKeys.sort((a, b) => {
        const numA = parseInt(a.split('_')[1])
        const numB = parseInt(b.split('_')[1])
        return numA - numB
      })

      // Ordenar las claves CAMELOT según el orden en camelot.fields
      if (this.camelot && this.camelot.fields) {
        camelotKeys.sort((a, b) => {
          const indexA = this.camelot.fields.findIndex(field => field.key === a)
          const indexB = this.camelot.fields.findIndex(field => field.key === b)
          return indexA - indexB
        })
      }

      // Agregar la celda de autores primero
      arr.push(this.generateBodyCell(data.authors, true, 20))

      // Agregar las celdas de column_X
      for (const key of columnKeys) {
        arr.push(this.generateBodyCell(data[key], false, 20))
      }

      // Agregar las celdas CAMELOT
      for (const key of camelotKeys) {
        arr.push(this.generateBodyCell(data[key], false, 20))
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
      if (data === undefined) {
        return new TextRun({
          text: '',
          bold: isBold,
          size: size
        })
      }

      if (Object.prototype.hasOwnProperty.call(data, 'label')) {
        return new TextRun({
          text: data.label || '',
          bold: isBold,
          size: size
        })
      } else {
        return new TextRun({
          text: data || '',
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
