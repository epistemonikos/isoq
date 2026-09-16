import { lockLostMessageKey, lockDeniedMessageKey, isRetryableLockLoss } from '@/utils/lockLostMessage'

/**
 * El latido distingue tres motivos por los que se pierde un ref-lock, y no se le explican
 * igual a la persona. La diferencia que importa no es quién lo tiene: es si va a poder
 * seguir. Un desalojo por granularidad se resuelve solo en cuanto la otra persona suelta la
 * hoja; un lock que alguien tomó, no.
 *
 * La regla vive en un solo lugar porque siete handlers muestran este cartel.
 */
describe('lockLostMessageKey()', () => {
  it('avisa que el desalojo es temporal cuando otra persona tiene otra parte del estudio', () => {
    expect(lockLostMessageKey('evicted_granularity_conflict', 'Ana'))
      .toBe('lock.evicted_granularity')
  })

  it('usa el texto de siempre cuando otra persona tomó el lock', () => {
    expect(lockLostMessageKey('locked_by_other_user', 'Ana')).toBe('lock.ref_locked_by')
  })

  it('no nombra a nadie cuando el lock caducó', () => {
    expect(lockLostMessageKey('lock_expired', null)).toBe('lock.lock_expired')
  })

  // Un servidor sin ese despliegue, un 401 o un 403 no mandan motivo. El cartel tiene que
  // seguir diciendo algo cierto, y lo único que se sabe ahí es si hay a quién nombrar.
  describe('sin motivo declarado', () => {
    it('nombra a quien lo tiene, si el 409 lo trajo', () => {
      expect(lockLostMessageKey(null, 'Ana')).toBe('lock.ref_locked_by')
    })

    it('cae al texto anónimo cuando no hay nombre', () => {
      expect(lockLostMessageKey(null, null)).toBe('lock.permissions_revoked')
    })
  })

  // Un motivo que este cliente no conoce todavía: mismo criterio que el 409 de versión, el
  // default cae del lado del comportamiento anterior en vez de romper.
  it('trata un motivo desconocido como el caso de siempre', () => {
    expect(lockLostMessageKey('algo_que_no_existe', 'Ana')).toBe('lock.ref_locked_by')
  })
})

/**
 * El acquire tiene su propio motivo y su propio texto. La situación de fondo es la misma
 * —alguien tiene otra granularidad del mismo estudio— pero lo que hay que decirle a la
 * persona no: en el latido perdió algo que tenía, acá nunca lo tuvo y está decidiendo si
 * esperar. Por eso el servidor manda dos valores distintos y nosotros dos textos distintos.
 */
describe('lockDeniedMessageKey()', () => {
  it('explica que sólo otra parte del estudio está tomada', () => {
    expect(lockDeniedMessageKey('locked_at_another_granularity', 'Ana'))
      .toBe('lock.locked_at_another_granularity')
  })

  it('usa el texto de siempre cuando el estudio entero está tomado', () => {
    expect(lockDeniedMessageKey('locked_by_other_user', 'Ana')).toBe('lock.ref_locked_by')
  })

  it('cae al texto de siempre sin motivo declarado', () => {
    expect(lockDeniedMessageKey(null, 'Ana')).toBe('lock.ref_locked_by')
    expect(lockDeniedMessageKey(null, null)).toBe('lock.permissions_revoked')
  })

  it('trata un motivo desconocido como el caso de siempre', () => {
    expect(lockDeniedMessageKey('lo_que_inventen_manana', 'Ana')).toBe('lock.ref_locked_by')
  })
})

describe('isRetryableLockLoss()', () => {
  // Lo que decide si tiene sentido ofrecerle volver a intentar: los dos motivos de
  // granularidad se destraban solos cuando la otra persona suelta la hoja. Que vengan de
  // endpoints distintos no cambia eso.
  it.each([
    ['evicted_granularity_conflict', true],
    ['locked_at_another_granularity', true],
    ['locked_by_other_user', false],
    ['lock_expired', false],
    [null, false]
  ])('para %s devuelve %s', (reason, expected) => {
    expect(isRetryableLockLoss(reason)).toBe(expected)
  })
})
