import { footerTexts } from '@/utils/exportFooter'
import { printFooterCss } from '@/utils/printFooter'

const STYLE_ID = 'isoq-print-footer'

/**
 * El pie de página del PDF (#416), puesto sólo mientras se imprime: `beforeprint` lo agrega y
 * `afterprint` lo saca. Cubre el botón (window.print() dispara esos eventos) y Ctrl+P.
 *
 * Contrato con el anfitrión:
 *   printFooterSource() — `{ project, findingNumber? }`, o null si todavía no hay proyecto.
 *     Se lee al imprimir, no al montar: el proyecto puede cambiar mientras la vista vive.
 */
export default {
  mounted () {
    this.$_printFooterOn = () => this.addPrintFooter()
    this.$_printFooterOff = () => this.removePrintFooter()
    window.addEventListener('beforeprint', this.$_printFooterOn)
    window.addEventListener('afterprint', this.$_printFooterOff)
  },
  beforeDestroy () {
    window.removeEventListener('beforeprint', this.$_printFooterOn)
    window.removeEventListener('afterprint', this.$_printFooterOff)
    this.removePrintFooter()
  },
  methods: {
    addPrintFooter () {
      this.removePrintFooter()
      const source = typeof this.printFooterSource === 'function' ? this.printFooterSource() : null
      if (!source || !source.project) return
      const texts = footerTexts(source.project, key => this.$t(key), source.findingNumber)
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = printFooterCss(texts, key => this.$t(key))
      document.head.appendChild(style)
    },
    removePrintFooter () {
      const style = document.getElementById(STYLE_ID)
      if (style) style.remove()
    }
  }
}
