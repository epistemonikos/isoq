// Fechas que manda el servidor: datetime naive en UTC serializados con isoformat(), sin zona.
// `new Date()` lee una fecha-hora ISO sin zona como hora LOCAL, así que en UTC-3 todas las horas
// salían corridas tres horas. Una fecha con zona explícita se respeta.
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

export function parseServerDate (value) {
  if (!value) return null
  const text = String(value)
  const date = new Date(HAS_ZONE.test(text) ? text : `${text}Z`)
  return isNaN(date.getTime()) ? null : date
}

export function formatServerDate (value) {
  const date = parseServerDate(value)
  return date ? date.toLocaleString() : ''
}
