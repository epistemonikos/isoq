import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import { displayExplanation } from '@/components/utils/commons'

export function generateWordDocument (project, findings, references, listsPrintVersion, printableItems, cerqualConfidence, selectOptions, routeName, publicType) {
  const filename = project.name ? project.name + ' - Summary of Qualitative Findings Table.docx' : 'Summary of Qualitative Findings Table.docx'
  const doc = new Document()

  doc.addSection({
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
            text: project.name,
            bold: true,
            size: 36,
            font: { name: 'Times New Roman' },
            color: '000000'
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: 'Summary of Qualitative Findings Table',
            bold: true,
            size: 36,
            font: { name: 'Times New Roman' },
            color: '000000'
          })
        ]
      }),
      new Paragraph(''),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Review question',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: project.review_question,
            size: 24
          })
        ]
      }),
      new Paragraph(''),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Authors of the review',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: project.authors,
            size: 24
          })
        ]
      }),
      new Paragraph(''),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Corresponding author',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          generateAuthorInfo(project)
        ]
      }),
      new Paragraph(''),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Has the review been published?',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: (project.published_status) ? ('Yes' + (project.url_doi.length) ? ' | DOI: ' + project.url_doi : '') : 'No',
            size: 24
          })
        ]
      }),
      new Paragraph(''),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Additional Information',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: project.description,
            size: 24
          })
        ]
      }),
      new Paragraph(''),
      ...generateLicense(project),
      ...generateFindingsTable(findings, listsPrintVersion, printableItems, cerqualConfidence, selectOptions, references)
    ]
  })
  if (findings.length && (routeName === 'viewProject' || (routeName === 'previewContentSoQf' && project.public_type !== 'minimally'))) {
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
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: 'Evidence Profile Table',
              bold: true,
              size: 32,
              font: { name: 'Times New Roman' },
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
              style: BorderStyle.NONE
            },
            bottom: {
              size: 1,
              color: '000000',
              style: BorderStyle.NONE
            },
            left: {
              size: 1,
              color: '000000',
              style: BorderStyle.NONE
            },
            right: {
              size: 1,
              color: '000000',
              style: BorderStyle.NONE
            },
            insideHorizontal: {
              size: 1,
              color: '000000',
              style: BorderStyle.NONE
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
              tableHeader: true,
              height: {
                height: 1444,
                rule: HeightRule.EXACT
              },
              children: [
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '5%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '#',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '40%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Summarised review finding',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  width: {
                    size: '10%',
                    type: WidthType.PERCENTAGE
                  },
                  shading: {
                    fill: '#DDDDDD'
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Methodological limitations',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  width: {
                    size: '10%',
                    type: WidthType.PERCENTAGE
                  },
                  shading: {
                    fill: '#DDDDDD'
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Coherence',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '10%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Adequacy',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '10%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Relevance',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '10%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'GRADE-CERQual assessment of confidence',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: '#DDDDDD'
                  },
                  width: {
                    size: '5%',
                    type: WidthType.PERCENTAGE
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'References',
                          size: 22,
                          bold: true
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            ...generateEvidenceProfileTable2(listsPrintVersion, printableItems, selectOptions, cerqualConfidence, references)
          ]
        })
      ]
    })
  }
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, filename)
  })
}

function generateAuthorInfo (project) {
  let data = ''
  if (project.author.length) {
    data = project.author.toString()
    if (project.author_email.length) {
      const email = project.author_email.toString()
      data = data.concat(' - ' + email)
    }
  }

  return new TextRun({
    text: data,
    size: 24
  })
}

function generateLicense (project) {
  let content = []
  if (project.public_type !== 'private') {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'License',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: project.license_type,
            size: 24
          })
        ]
      }),
      new Paragraph('')
    )
  }
  return content
}

function generateFindingsTable (findings, listsPrintVersion, printableItems, cerqualConfidence, selectOptions, references) {
  if (findings.length === 0) {
    return []
  }
  return [new Table({
    borders: {
      top: {
        size: 1,
        color: '000000',
        style: BorderStyle.NONE
      },
      bottom: {
        size: 1,
        color: '000000',
        style: BorderStyle.NONE
      },
      left: {
        size: 1,
        color: '000000',
        style: BorderStyle.NONE
      },
      right: {
        size: 1,
        color: '000000',
        style: BorderStyle.NONE
      },
      insideHorizontal: {
        size: 1,
        color: '000000',
        style: BorderStyle.NONE
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
        tableHeader: true,
        height: {
          height: 1444,
          rule: HeightRule.EXACT
        },
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: {
              fill: '#DDDDDD'
            },
            width: {
              size: '5%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '#',
                    size: 22,
                    bold: true
                  })
                ]
              })
            ]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '40%',
              type: WidthType.PERCENTAGE
            },
            shading: {
              fill: '#DDDDDD'
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Summarised review finding',
                    size: 22,
                    bold: true
                  })
                ]
              })
            ]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: {
              size: '20%',
              type: WidthType.PERCENTAGE
            },
            shading: {
              fill: '#DDDDDD'
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'GRADE-CERQual Assessment of confidence',
                    size: 22,
                    bold: true
                  })
                ]
              })
            ]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: {
              fill: '#DDDDDD'
            },
            width: {
              size: '20%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Explanation of GRADE-CERQual Assessment',
                    size: 22,
                    bold: true
                  })
                ]
              })
            ]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: {
              fill: '#DDDDDD'
            },
            width: {
              size: '15%',
              type: WidthType.PERCENTAGE
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'References',
                    size: 22,
                    bold: true
                  })
                ]
              })
            ]
          })
        ]
      }),
      ...generateFindingsTableContent(listsPrintVersion, printableItems, cerqualConfidence, selectOptions, references)
    ]
  })]
}

function generateFindingsTableContent (listsPrintVersion, printableItems, cerqualConfidence, selectOptions, references) {
  const filteredItems = filteredPrintedData(listsPrintVersion, printableItems)
  return filteredItems.map((item, index) => {
    if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
      return new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: item.name.toUpperCase(),
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          })
        ]
      })
    } else {
      return new TableRow({
        children: [
          generateTableCell({width_size: '5%', text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER}),
          generateTableCell({width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.LEFT}),
          generateTableCell({width_size: '20%', text: item.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
          generateTableCell({width_size: '20%', text: item.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
          generateTableCell({width_size: '15%', text: item.ref_list, font_size: 16, align: AlignmentType.LEFT})
        ]
      })
    }
  })
}

function filteredPrintedData (listsPrintVersion, printableItems) {
  return listsPrintVersion.filter((item) => {
    if (printableItems.includes(item.id)) {
      return item
    }
  })
}

function generateTableCell (content) {
  return new TableCell({
    width: {
      size: content.width_size,
      type: WidthType.PERCENTAGE
    },
    children: [
      generateParagraph(content),
      ...(generateParagraphExplanation(content))
    ]
  })
}

function generateParagraph (content) {
  return new Paragraph({
    indent: {
      left: 100,
      right: 100
    },
    alignment: content.alignment,
    children: [
      generateText(content)
    ]
  })
}

function generateText (content) {
  return new TextRun({
    text: content.text,
    size: content.font_size
  })
}

function generateParagraphExplanation (content) {
  let paragraph = []
  if (content.explanation !== '') {
    if (Object.prototype.hasOwnProperty.call(content, 'explanation')) {
      paragraph.push(
        new Paragraph('')
      )
      paragraph.push(
        new Paragraph({
          children: [
            ...(generateExplanationText(content))
          ]
        })
      )
    }
  }
  return paragraph
}

function generateExplanationText (content) {
  let text = []
  text.push(
    new TextRun({
      text: 'Explanation: ',
      size: content.font_size,
      bold: true
    })
  )
  text.push(
    new TextRun({
      text: content.explanation,
      size: content.font_size
    })
  )
  return text
}

function generateEvidenceProfileTable2 (listsPrintVersion, printableItems, selectOptions, cerqualConfidence, references) {
  const items = filteredPrintedData(listsPrintVersion, printableItems)
  return items.map((item, index) => {
    if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
      return new TableRow({
        children: [
          new TableCell({
            columnSpan: 8,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: item.name.toUpperCase(),
                    bold: true,
                    size: 22
                  })
                ]
              })
            ]
          })
        ]
      })
    } else {
      if (Object.prototype.hasOwnProperty.call(item, 'evidence_profile')) {
        if (item.evidence_profile === undefined) {
          return new TableRow({
            children: [
              generateTableCell({
                width_size: '5%',
                text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                font_size: 22,
                align: AlignmentType.CENTER
              }),
              generateTableCell({
                width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.CENTER
              }),
              new TableCell({
                columnSpan: 5,
                width_size: '40%',
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '',
                        size: 22
                      })
                    ]
                  })
                ]
              }),
              generateTableCell({
                width_size: '5%',
                text: returnRefWithNames(item.references, references),
                font_size: 16,
                align: AlignmentType.LEFT
              })
            ]
          })
        } else {
          return new TableRow({
            children: [
              generateTableCell({
                width_size: '5%',
                text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                font_size: 22,
                align: AlignmentType.CENTER
              }),
              generateTableCell({
                width_size: '40%',
                text: item.name,
                font_size: 22,
                align: AlignmentType.CENTER
              }),
              generateTableCell(
                {
                  width_size: '10%',
                  text: displaySelectedOptionLocal(item.evidence_profile.methodological_limitations.option, selectOptions, cerqualConfidence),
                  explanation: (item.evidence_profile.methodological_limitations.option.length) ? getExplanation('methodological-limitations', item.evidence_profile.methodological_limitations.option, item.evidence_profile.methodological_limitations.explanation) : '',
                  font_size: 22,
                  align: AlignmentType.LEFT
                }
              ),
              generateTableCell({
                width_size: '10%',
                text: displaySelectedOptionLocal(item.evidence_profile.coherence.option, selectOptions, cerqualConfidence),
                explanation: (item.evidence_profile.coherence.explanation.length) ? getExplanation('coherence', item.evidence_profile.coherence.option, item.evidence_profile.coherence.explanation) : '',
                font_size: 22,
                align: AlignmentType.CENTER
              }),
              generateTableCell({
                width_size: '10%',
                text: displaySelectedOptionLocal(item.evidence_profile.adequacy.option, selectOptions, cerqualConfidence),
                explanation: (item.evidence_profile.adequacy.explanation.length) ? getExplanation('adequacy', item.evidence_profile.adequacy.option, item.evidence_profile.adequacy.explanation) : '',
                font_size: 22,
                align: AlignmentType.LEFT
              }),
              generateTableCell({
                width_size: '10%',
                text: displaySelectedOptionLocal(item.evidence_profile.relevance.option, selectOptions, cerqualConfidence),
                explanation: (item.evidence_profile.relevance.explanation.length) ? getExplanation('relevance', item.evidence_profile.relevance.option, item.evidence_profile.relevance.explanation) : '',
                font_size: 22,
                align: AlignmentType.LEFT
              }),
              generateTableCell({
                width_size: '10%',
                text: displaySelectedOptionLocal(item.evidence_profile.cerqual.option, selectOptions, cerqualConfidence, 'cerqual'),
                explanation: (item.evidence_profile.cerqual.explanation.length) ? item.evidence_profile.cerqual.explanation : '',
                font_size: 22,
                align: AlignmentType.LEFT
              }),
              generateTableCell({
                width_size: '5%',
                text: returnRefWithNames(item.references, references),
                font_size: 16,
                align: AlignmentType.LEFT
              })
            ]
          })
        }
      } else {
        return new TableRow({
          children: [
            generateTableCell({
              width_size: '40%',
              text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : (Object.prototype.hasOwnProperty.call(item, 'sort')) ? item.sort : index + 1,
              font_size: 22,
              align: AlignmentType.LEFT
            }),
            generateTableCell({
              width_size: '40%',
              text: item.name,
              font_size: 22,
              align: AlignmentType.LEFT
            }),
            new TableCell({
              columnSpan: 5,
              width_size: '40%',
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: '',
                      size: 22
                    })
                  ]
                })
              ]
            }),
            generateTableCell({
              width_size: '10%',
              text: returnRefWithNames(item.references, references),
              font_size: 16,
              align: AlignmentType.LEFT
            })
          ]
        })
      }
    }
  })
}

function displaySelectedOptionLocal (option, selectOptions, cerqualConfidence, type = '') {
  if (option === null) {
    return ''
  } else if (option >= 0) {
    if (type === 'cerqual') {
      return cerqualConfidence[option].text
    } else {
      return selectOptions[option].text
    }
  } else {
    return ''
  }
}

function returnRefWithNames (array, references) {
  let authorsList = []
  for (const i in array) {
    for (const r of references) {
      if (r.id === array[i]) {
        authorsList.push(getAuthorsFormat(r.authors, r.publication_year))
      }
    }
  }
  authorsList.sort()
  let authors = ''
  for (let x in authorsList) {
    authors = authors + authorsList[x] + '; '
  }
  return authors
}

function getAuthorsFormat (authors = [], pubYear = '') {
  if (authors.length) {
    const nroAuthors = authors.length
    if (nroAuthors === 1) {
      return authors[0].split(',')[0] + ' ' + pubYear
    } else if (nroAuthors === 2) {
      return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0] + ' ' + pubYear
    } else {
      return authors[0].split(',')[0] + ' et al. ' + ' ' + pubYear
    }
  } else {
    return 'author(s) not found'
  }
}

function getExplanation (type, option, explanation) {
  return displayExplanation(type, option, explanation)
}
