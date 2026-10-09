/**
 * La celda References de la versión impresa del perfil de evidencia lista las citas del
 * finding. `list.references` se guarda en el orden en que se marcaron las casillas, así que
 * recorrerla tal cual ponía al final el estudio agregado después. El orden es de
 * presentación y se deriva de la etiqueta que se lee.
 */
import editListEvidenceProfile from '@/components/list/editListEvidenceProfile.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

function referencesFormatter (references) {
  const fields = editListEvidenceProfile.computed.evidenceProfileFieldsPrintVersion.call({
    $t: (key) => key,
    references
  })
  return fields.find(f => f.key === 'references').formatter
}

describe('editListEvidenceProfile — celda References impresa', () => {
  const references = [
    { id: 'rS', content: 'Smith 2020; ' },
    { id: 'rA', content: 'Adams 2019; ' },
    { id: 'rM', content: 'Moore 2021; ' }
  ]

  it('lista las citas en orden alfabético aunque el estudio se haya agregado al final', () => {
    const formatter = referencesFormatter(references)
    expect(formatter(['rS', 'rA', 'rM'])).toBe('Adams 2019; Moore 2021; Smith 2020; ')
  })

  it('ignora un id que ya no está entre las referencias', () => {
    const formatter = referencesFormatter(references)
    expect(formatter(['rS', 'gone', 'rA'])).toBe('Adams 2019; Smith 2020; ')
  })
})
