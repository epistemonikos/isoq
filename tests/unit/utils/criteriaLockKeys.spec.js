import { criteriaLockKey, CRITERIA_FIELDS } from '@/utils/criteriaLockKeys'
import { baseRefOf } from '@/utils/camelotAssessmentKeys'

describe('criteriaLockKeys', () => {
  it('deriva la clave de lock de cada criterio del Paso 2', () => {
    expect(criteriaLockKey('inclusion')).toBe('criteria::inclusion')
    expect(criteriaLockKey('exclusion')).toBe('criteria::exclusion')
  })

  it('no devuelve clave para un campo desconocido', () => {
    expect(criteriaLockKey('')).toBeNull()
    expect(criteriaLockKey(undefined)).toBeNull()
    expect(criteriaLockKey('inclusion_notes')).toBeNull()
  })

  it('expone los dos campos que se bloquean', () => {
    expect(CRITERIA_FIELDS).toEqual(['inclusion', 'exclusion'])
  })

  // El backend trata cualquier clave que matchee '{base}::s{n}::o{n}' como HOJA de
  // un estudio (ref_locks.LEAF_KEY_RE) y la hace chocar con el lock de ese estudio.
  // Si la clave del criterio cayera en ese formato, bloquear un criterio bloquearía
  // un estudio inexistente — y viceversa.
  it('no tiene forma de clave de hoja de estudio', () => {
    expect(baseRefOf(criteriaLockKey('inclusion'))).toBeNull()
    expect(baseRefOf(criteriaLockKey('exclusion'))).toBeNull()
  })
})
