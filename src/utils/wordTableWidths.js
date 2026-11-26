import { PageOrientation, TableLayoutType, WidthType } from 'docx'

// Anchos de columna de las tablas de Word (#168).
//
// docx 9 le agrega «%» a todo número de un ancho `pct`: `{ size: 250, type: PERCENTAGE }`
// sale como «250%», no como 250 cincuentavos. Y sin `columnWidths` la grilla queda en 100
// twips iguales, así que Word reparte a su manera. Por eso: porcentajes reales en las
// celdas, la grilla en twips sobre el ancho útil de la página y layout fijo.

// A4, como el resto del export (docx no cambia el tamaño por defecto).
const A4_SHORT = 11906
const A4_LONG = 16838
// docx escribe 1440 si la sección no trae `page.margin`.
const DEFAULT_MARGIN = 1440

// «#» lo más angosto posible: con los márgenes de celda (2 × 108 twips) deja lugar para
// «100» en vertical y en horizontal.
const NUMBER_COLUMN_PCT = 6

/**
 * Porcentajes de una tabla de findings: «#», finding y `others` columnas más; el finding
 * vale el doble de cada una de las demás (pedido de Megan para el SoQf y el Evidence Profile).
 */
export function findingTablePercents (others) {
  const unit = (100 - NUMBER_COLUMN_PCT) / (others + 2)
  return [NUMBER_COLUMN_PCT, unit * 2, ...Array(others).fill(unit)]
}

/**
 * Ancho útil de una página (en twips) según la configuración `page` de la sección, leída
 * como la lee docx 9: la orientación va en `page.size.orientation` y los márgenes en
 * `page.margin`. (`page.orientation` y `margins` los ignora: medido en el XML.)
 */
export function contentWidth (page = {}) {
  const landscape = Boolean(page.size && page.size.orientation === PageOrientation.LANDSCAPE)
  const width = landscape ? A4_LONG : A4_SHORT
  const margin = page.margin || {}
  const left = margin.left !== undefined ? margin.left : DEFAULT_MARGIN
  const right = margin.right !== undefined ? margin.right : DEFAULT_MARGIN
  return width - left - right
}

/** Pesos cualesquiera → porcentajes que suman 100. Sin pesos, columnas iguales. */
export function toPercents (weights) {
  const valid = weights.map(w => (typeof w === 'number' && w > 0 ? w : 0))
  const total = valid.reduce((a, b) => a + b, 0)
  if (!total) return weights.map(() => 100 / weights.length)
  return valid.map(w => (w * 100) / total)
}

/** Ancho de celda en porcentaje, con el formato que docx escribe tal cual. */
export function cellWidth (percent) {
  return { size: `${Number(percent.toFixed(2))}%`, type: WidthType.PERCENTAGE }
}

/** Lo que va en `new Table({...})` para que la grilla respete los porcentajes. */
export function tableLayout (percents, page) {
  const available = contentWidth(page)
  return {
    width: { size: '100%', type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: percents.map(p => Math.round((p * available) / 100))
  }
}
