import { parseServerDate, formatServerDate } from '@/utils/serverDate'

// El servidor serializa los datetime naive en UTC con isoformat(), sin zona. `new Date()` lee
// una fecha-hora ISO sin zona como hora LOCAL, así que en UTC-3 todas las horas salían corridas.
describe('serverDate', () => {
  it('lee una fecha sin zona como UTC', () => {
    expect(parseServerDate('2026-01-02T03:04:05').getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5))
  })

  it('con microsegundos también', () => {
    expect(parseServerDate('2026-01-02T03:04:05.123456').getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5, 123))
  })

  it('respeta una zona explícita', () => {
    expect(parseServerDate('2026-01-02T03:04:05+02:00').getTime()).toBe(Date.UTC(2026, 0, 2, 1, 4, 5))
    expect(parseServerDate('2026-01-02T03:04:05Z').getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5))
  })

  it('vacío o inválido es null, y se formatea como cadena vacía', () => {
    expect(parseServerDate(null)).toBeNull()
    expect(parseServerDate('no-es-fecha')).toBeNull()
    expect(formatServerDate(null)).toBe('')
    expect(formatServerDate('no-es-fecha')).toBe('')
  })
})
