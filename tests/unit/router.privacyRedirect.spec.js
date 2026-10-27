import { createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import routes from '@/router'

const localVue = createLocalVue()
localVue.use(VueRouter)

// Integration with a real vue-router: the short URLs of the legal parts reach
// PrivacyAndTerms on their tab, with ENABLE_GDPR on or off (the documents are
// public; the flag only decides whether people must accept them).
function nuevoRouter () {
  // mode 'abstract': no hay history ni hash en jsdom.
  return new VueRouter({ mode: 'abstract', routes })
}

// Se espera el hook afterEach, no el callback de push().
//
// Un next({name}) desde un guard aborta la navegación original con un error
// NavigationRedirected y arranca otra. El onAbort de push() se dispara en ese
// momento, ANTES de que la segunda termine — y como los componentes son lazy,
// vue-router tiene que resolverlos antes de confirmar. Leyendo currentRoute en
// el onAbort se ve la ruta inicial vacía, no el destino.
//
// afterEach sólo corre cuando una navegación se confirma, así que la primera
// vez que se dispara ya es el destino final de la cadena.
const irA = (router, path) => new Promise((resolve, reject) => {
  const cancelar = setTimeout(
    () => reject(new Error(`la navegación a ${path} nunca se confirmó`)),
    3000
  )
  router.afterEach((to) => {
    clearTimeout(cancelar)
    resolve(to)
  })
  router.push(path, () => {}, () => {})
})

describe('redirects legados de PrivacyAndTerms — integración con vue-router', () => {
  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  describe('con ENABLE_GDPR encendido', () => {
    beforeEach(() => { process.env.ENABLE_GDPR = 'on' })

    it('/privacy-and-terms resuelve a PrivacyAndTerms', async () => {
      const ruta = await irA(nuevoRouter(), '/privacy-and-terms')
      expect(ruta.name).toBe('PrivacyAndTerms')
    })

    it.each([
      ['/terms-and-conditions', 'terms'],
      ['/privacy-policy', 'privacy'],
      ['/intellectual-property', 'property'],
      ['/cookie-policy', 'cookies'],
      ['/data-processing-terms', 'processing']
    ])('%s llega a PrivacyAndTerms con la pestaña %s', async (path, tab) => {
      const ruta = await irA(nuevoRouter(), path)
      expect(ruta.name).toBe('PrivacyAndTerms')
      expect(ruta.query.tab).toBe(tab)
    })
  })

  // The legal documents are public: with the flag off they are still there to read.
  describe('with ENABLE_GDPR off', () => {
    beforeEach(() => { process.env.ENABLE_GDPR = 'off' })

    it('/privacy-and-terms resolves to PrivacyAndTerms', async () => {
      const route = await irA(nuevoRouter(), '/privacy-and-terms')
      expect(route.name).toBe('PrivacyAndTerms')
    })

    it.each([
      ['/terms-and-conditions', 'terms'],
      ['/privacy-policy', 'privacy'],
      ['/intellectual-property', 'property'],
      ['/cookie-policy', 'cookies'],
      ['/data-processing-terms', 'processing']
    ])('%s reaches PrivacyAndTerms on tab %s', async (path, tab) => {
      const route = await irA(nuevoRouter(), path)
      expect(route.name).toBe('PrivacyAndTerms')
      expect(route.query.tab).toBe(tab)
    })
  })
})

// ─── El título de la pestaña ───────────────────────────────────────────────────
//
// Regresión encontrada EN EL NAVEGADOR, no en los tests: con el flag apagado,
// /privacy-and-terms mostraba la home pero la pestaña decía "Privacy and Terms".
// El título se ponía en el beforeEach global, que corre ANTES de los beforeEnter
// de ruta, así que sobrevivía a la redirección.
//
// Se replica acá el hook tal como quedó en main.js (afterEach), por la misma
// razón que router.guard.spec.js replica el guard: main.js no es importable en
// jest sin arrastrar toda la app.

describe('document title', () => {
  const conTitulo = (router) => {
    router.afterEach((to) => {
      const nearest = to.matched.slice().reverse().find(r => r.meta && r.meta.title)
      if (nearest) document.title = nearest.meta.title
    })
    return router
  }

  beforeEach(() => { document.title = 'inicial' })
  afterEach(() => { process.env.ENABLE_GDPR = 'on' })

  it.each(['on', 'off'])('is the legal page title with ENABLE_GDPR %s', async (flag) => {
    process.env.ENABLE_GDPR = flag
    await irA(conTitulo(nuevoRouter()), '/privacy-and-terms')

    expect(document.title).toContain('Privacy and Terms')
  })

  it('a short URL gets the legal page title too', async () => {
    process.env.ENABLE_GDPR = 'off'
    await irA(conTitulo(nuevoRouter()), '/terms-and-conditions')

    expect(document.title).toContain('Privacy and Terms')
  })
})
