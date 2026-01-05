import {
  saveProject,
  getProject,
  getAllProjects,
  saveWorksheet,
  getWorksheet,
  getWorksheetsByProject,
  saveFinding,
  getFindingsByWorksheet,
  saveReference,
  getReferencesByProject,
  saveCharacteristic,
  getCharacteristicsByProject,
  saveAssessment,
  getAssessmentsByProject,
  saveExtractedData,
  getExtractedDataByFinding,
  saveListCategory,
  getListCategoriesByProject
} from '@/services/db'

export const strategies = [
  {
    name: 'projects-list',
    patterns: [/^(\/isoqf_projects|\/getProjects)(\/?$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const project of data) {
          await saveProject({ id: project.id, data: project })
        }
      } else if (data && data.id) {
        await saveProject({ id: data.id, data })
      }
    },
    serve: async (url, params) => {
      // Logic from Api.js:234
      const cached = await getAllProjects()
      if (cached && cached.length > 0) {
        return cached.map(p => p.data)
      }
      return null
    }
  },
  {
    name: 'project-single',
    patterns: [/^\/isoqf_projects\/([a-zA-Z0-9]+)/],
    save: async (data) => {
      // Reuse saveProject logic
      if (data && data.id) {
        await saveProject({ id: data.id, data })
      }
    },
    serve: async (url, params) => {
      const match = url.match(/\/isoqf_projects\/([a-zA-Z0-9]+)/)
      if (match) {
        const projectId = match[1]
        const cached = await getProject(projectId)
        if (cached) return cached.data
      }
      return null
    }
  },
  {
    name: 'worksheets',
    patterns: [/^\/isoqf_lists(\/|$|\?)|^\/getLists/],
    save: async (data, url) => {
      if (Array.isArray(data)) {
        for (const worksheet of data) {
          await saveWorksheet({
            id: worksheet.id,
            projectId: worksheet.project_id,
            data: worksheet
          })
        }
      } else if (data && data.id) {
        await saveWorksheet({
          id: data.id,
          projectId: data.project_id,
          data
        })
      }
    },
    serve: async (url, params) => {
      // Handle various worksheet retrieval patterns
      // 1. Single worksheet by ID in regex
      const singleMatch = url.match(/getLists\?id=([a-zA-Z0-9]+)/)
      if (singleMatch) {
         return await hydrateWorksheet(singleMatch[1])
      }
      
      // 2. Single worksheet by ID in params
      if ((url === '/getLists' || url === '/getLists/') && params && params.id) {
        return await hydrateWorksheet(params.id)
      }

      // 3. By Project ID in regex
      const projectMatch = url.match(/isoqf_lists\?project_id=([a-zA-Z0-9]+)/)
      if (projectMatch) {
        const cached = await getWorksheetsByProject(projectMatch[1])
        if (cached && cached.length > 0) return cached.map(w => w.data)
      }

      // 4. By Project ID in params
      if ((url === '/isoqf_lists' || url === '/isoqf_lists/') && params && params.project_id) {
         const cached = await getWorksheetsByProject(params.project_id)
         if (cached && cached.length > 0) return cached.map(w => w.data)
      }
      
      return null
    }
  },
  {
    name: 'findings',
    patterns: [/^\/isoqf_findings(\/|$|\?)|^\/findings/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const finding of data) {
          await saveFinding({
            id: finding.id,
            worksheetId: finding.list_id,
            data: finding
          })
        }
      }
    },
    serve: async (url, params) => {
      if (!params) return null
      
      if (params.list_id) {
        const cached = await getFindingsByWorksheet(params.list_id)
        if (cached && cached.length > 0) return cached.map(r => r.data)
      } else if (params.list_ids) {
        const ids = params.list_ids.split(',').map(id => id.trim()).filter(id => id)
        let allFindings = []
        for (const id of ids) {
            const cached = await getFindingsByWorksheet(id)
            if (cached && cached.length > 0) {
                allFindings = allFindings.concat(cached.map(r => r.data))
            }
        }
        if (allFindings.length > 0) return allFindings
      }
      return null
    }
  },
  {
    name: 'references',
    patterns: [/^\/isoqf_references(\/|$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const ref of data) {
          await saveReference({
            id: ref.id,
            projectId: ref.project_id,
            data: ref
          })
        }
      }
    },
    serve: async (url, params) => {
      const pId = getProjectIdFromParams(params)
      if (pId) {
        const cached = await getReferencesByProject(pId)
        if (cached && cached.length > 0) return cached.map(r => r.data)
      }
      return null
    }
  },
  {
    name: 'characteristics',
    patterns: [/^\/isoqf_characteristics(\/|$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          await saveCharacteristic(item)
        }
      }
    },
    serve: async (url, params) => {
      const pId = getProjectIdFromParams(params)
      if (pId) {
        const cached = await getCharacteristicsByProject(pId)
        if (cached && cached.length > 0) return cached
      }
      return null
    }
  },
  {
    name: 'assessments',
    patterns: [/^\/isoqf_assessments(\/|$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          await saveAssessment(item)
        }
      }
    },
    serve: async (url, params) => {
      const pId = getProjectIdFromParams(params)
      if (pId) {
        const cached = await getAssessmentsByProject(pId)
        if (cached && cached.length > 0) return cached
      }
      return null
    }
  },
  {
    name: 'extracted-data',
    patterns: [/^\/isoqf_extracted_data(\/|$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          await saveExtractedData(item)
        }
      }
    },
    serve: async (url, params) => {
      if (!params) return null
      
      if (params.finding_id || params.findingId) {
        const findingId = params.finding_id || params.findingId
        const cached = await getExtractedDataByFinding(findingId)
        if (cached && cached.length > 0) return cached
      } else if (params.list_id) {
        const findings = await getFindingsByWorksheet(params.list_id)
        let allExtracted = []
        if (findings && findings.length > 0) {
            for (const finding of findings) {
                const extracted = await getExtractedDataByFinding(finding.id)
                if (extracted && extracted.length > 0) {
                    allExtracted = allExtracted.concat(extracted)
                }
            }
        }
        if (allExtracted.length > 0) return allExtracted
      }
      return null
    }
  },
  {
    name: 'list-categories',
    patterns: [/^\/isoqf_list_categories(\/|$|\?)/],
    save: async (data) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          await saveListCategory(item)
        }
      }
    },
    serve: async (url, params) => {
      const pId = getProjectIdFromParams(params)
      if (pId) {
        const cached = await getListCategoriesByProject(pId)
        if (cached && cached.length > 0) return cached
      }
      return null
    }
  }
]

// Helpers
function getProjectIdFromParams(params) {
  if (!params) return null
  return params.project_id || params.projectId
}

async function hydrateWorksheet(worksheetId) {
    const cached = await getWorksheet(worksheetId)
    if (cached) {
        let data = cached.data
        const pId = data.project_id || cached.projectId
        
        // Hydrate project
        if (!data.project && pId) {
            const projectRec = await getProject(pId)
            if (projectRec) data.project = projectRec.data
        }
        
        // Hydrate fullreferences
        if (!data.fullreferences && pId) {
            const refs = await getReferencesByProject(pId)
            data.fullreferences = (refs && refs.length > 0) ? refs.map(r => r.data) : []
        } else if (!data.fullreferences) {
            data.fullreferences = []
        }

        // Hydrate findings
        if (!data.findings) {
            const findingsRec = await getFindingsByWorksheet(data.id)
            data.findings = (findingsRec && findingsRec.length > 0) ? findingsRec.map(r => r.data) : []
        }

        // Hydrate characteristics
        if (!data.characteristics && pId) {
            const chars = await getCharacteristicsByProject(pId)
            data.characteristics = (chars && chars.length > 0) ? chars : []
        } else if (!data.characteristics) {
            data.characteristics = []
        }

        // Hydrate assessments
        if (!data.assessments && pId) {
            const assess = await getAssessmentsByProject(pId)
            data.assessments = (assess && assess.length > 0) ? assess : []
        } else if (!data.assessments) {
            data.assessments = []
        }

        // Hydrate extracted_data
        if (!data.extracted_data) {
             if (data.findings && data.findings.length > 0) {
                  const findingId = data.findings[0].id
                  const extracted = await getExtractedDataByFinding(findingId)
                  data.extracted_data = (extracted && extracted.length > 0) ? extracted : []
             } else {
                  data.extracted_data = [] 
             }
        }

        return [data]
    }
    return null
}
