import { createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import routes from '@/router'

const localVue = createLocalVue()
localVue.use(VueRouter)

// Integración con vue-router de verdad, no llamando al beforeEnter a mano.
//
// Lo que se prueba acá y en ningún otro lado: que un `redirect` por NOMBRE
// dispare el beforeEnter de la ruta destino. De eso depende el diseño elegido
// (redirigir en vez de eliminar la ruta): si vue-router saltara el beforeEnter
// al resolver un redirect, las tres URLs legadas mostrarían la página de
// términos con el flag apagado y el gate tendría un agujero.
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
      ['/intellectual-property', 'property']
    ])('%s llega a PrivacyAndTerms con la pestaña %s', async (path, tab) => {
      const ruta = await irA(nuevoRouter(), path)
      expect(ruta.name).toBe('PrivacyAndTerms')
      expect(ruta.query.tab).toBe(tab)
    })
  })

  describe('con ENABLE_GDPR apagado', () => {
    beforeEach(() => { process.env.ENABLE_GDPR = 'off' })

    it('/privacy-and-terms termina en la home', async () => {
      const ruta = await irA(nuevoRouter(), '/privacy-and-terms')
      expect(ruta.name).toBe('MainPage')
    })

    it.each(['/terms-and-conditions', '/privacy-policy', '/intellectual-property'])(
      '%s termina en la home, no en la página de términos', async (path) => {
        // Éste es el caso que justifica todo el archivo: el redirect por nombre
        // tiene que heredar el gate.
        const ruta = await irA(nuevoRouter(), path)
        expect(ruta.name).toBe('MainPage')
      })

    it('no deja la navegación colgada ni en blanco', async () => {
      // Un next({name}) hacia un nombre inexistente dejaría currentRoute en la
      // ruta inicial '/' sin nombre. Verificar que hay un destino resuelto.
      const ruta = await irA(nuevoRouter(), '/privacy-and-terms')
      expect(ruta.matched.length).toBeGreaterThan(0)
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

describe('título del documento al redirigir', () => {
  const conTitulo = (router) => {
    router.afterEach((to) => {
      const nearest = to.matched.slice().reverse().find(r => r.meta && r.meta.title)
      if (nearest) document.title = nearest.meta.title
    })
    return router
  }

  beforeEach(() => { document.title = 'inicial' })
  afterEach(() => { process.env.ENABLE_GDPR = 'on' })

  it('con el flag apagado el título es el de la home, no el de términos', async () => {
    process.env.ENABLE_GDPR = 'off'
    await irA(conTitulo(nuevoRouter()), '/privacy-and-terms')

    expect(document.title).not.toContain('Privacy and Terms')
    expect(document.title).toContain('Interactive Summary of Qualitative Findings')
  })

  it('con el flag encendido el título sí es el de términos', async () => {
    process.env.ENABLE_GDPR = 'on'
    await irA(conTitulo(nuevoRouter()), '/privacy-and-terms')

    expect(document.title).toContain('Privacy and Terms')
  })

  it('las URLs legadas tampoco heredan el título equivocado', async () => {
    process.env.ENABLE_GDPR = 'off'
    await irA(conTitulo(nuevoRouter()), '/terms-and-conditions')

    expect(document.title).not.toContain('Privacy and Terms')
  })
})
