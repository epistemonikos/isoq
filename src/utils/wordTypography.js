// Tipografía de los exports Word (#168): todo Calibri; texto y tablas en 10 pt y los
// títulos en 12/14 pt. Los tamaños de docx van en medios puntos.
//
// Sin fuente por defecto en styles.xml, Word dibuja en Times New Roman todo run que no
// trae `font`: por eso `documentStyles` va en cada `new Document`, no sólo los tamaños.

export const FONT = 'Calibri'
export const BODY_SIZE = 20 // 10 pt: texto y tablas
export const HEADING_SIZE = 24 // 12 pt: títulos de sección
export const TITLE_SIZE = 28 // 14 pt: título del documento

const heading = (size) => ({ run: { font: FONT, size, bold: true, color: '000000' } })

/** Lo que va en `new Document({ styles: documentStyles, ... })`. */
export const documentStyles = {
  default: {
    document: { run: { font: FONT, size: BODY_SIZE } },
    title: heading(TITLE_SIZE),
    heading1: heading(TITLE_SIZE),
    heading2: heading(HEADING_SIZE),
    heading3: heading(HEADING_SIZE)
  }
}
