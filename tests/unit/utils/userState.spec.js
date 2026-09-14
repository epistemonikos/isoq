import { isUserActive, deriveUserState } from '@/utils/userState'

// El contrato del backend es "ausente = activo": `models.py` hace `get('active', True)`,
// `_sanitize_user` hace `setdefault('active', True)` y toda consulta de usuarios activos
// es `{'active': {'$ne': False}}`. Sólo el False explícito significa inactivo.
//
// El frontend lo leía con un chequeo truthy, que manda el campo ausente a la rama
// equivocada. Medido el 2026-09-14 en la base local: 1749 usuarios, 1747 SIN el campo,
// 0 con `active: False`. Todos salían tachados y con el select de permisos deshabilitado.
describe('userState — sólo el False explícito es inactivo', () => {
  describe('isUserActive', () => {
    it('trata al usuario SIN el campo `active` como activo', () => {
      // El caso real: el selector de Mongo no devuelve un campo que no existe en el doc.
      expect(isUserActive({ id: 'u1', username: 'damian@episte.co' })).toBe(true)
    })

    it('trata `active: undefined` como activo', () => {
      expect(isUserActive({ id: 'u1', active: undefined })).toBe(true)
    })

    it('trata `active: null` como activo', () => {
      // Un null serializado no es una desactivación: nadie lo escribe a propósito.
      expect(isUserActive({ id: 'u1', active: null })).toBe(true)
    })

    it('trata `active: false` como inactivo', () => {
      expect(isUserActive({ id: 'u1', active: false })).toBe(false)
    })

    it('trata `active: true` como activo', () => {
      expect(isUserActive({ id: 'u1', active: true })).toBe(true)
    })

    it('no se cae con un usuario nulo', () => {
      expect(isUserActive(null)).toBe(true)
      expect(isUserActive(undefined)).toBe(true)
    })
  })

  describe('deriveUserState', () => {
    it('devuelve "active" para el usuario sin el campo', () => {
      expect(deriveUserState({ id: 'u1' })).toBe('active')
    })

    it('devuelve "inactive" sólo para el False explícito', () => {
      expect(deriveUserState({ id: 'u1', active: false })).toBe('inactive')
    })

    it('ignora `status`, que es otro campo', () => {
      // Los fixtures de viewOrganization.spec.js traían `status: 'active'` y ningún
      // `active`: el bug estaba reproducido en la suite y pasaba verde igual.
      expect(deriveUserState({ id: 'u1', status: 'inactive' })).toBe('active')
      expect(deriveUserState({ id: 'u1', status: 'active', active: false })).toBe('inactive')
    })
  })
})
