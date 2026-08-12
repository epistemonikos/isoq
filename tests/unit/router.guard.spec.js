jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

// Minimal router guard extracted from main.js for isolated testing.
// The guard pattern: dispatch getLogginInfo → await state.promise → call next().
import { store } from '@/store'
import { TERMS_VERSION, needsTermsAcceptance } from '@/constants/terms'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

// Reproduce the guard logic from main.js so we can test it in isolation.
function runGuard (to, storeInstance = store) {
  return new Promise((resolve) => {
    const next = jest.fn(arg => resolve(arg))
    storeInstance.dispatch('getLogginInfo').then(() => {
      return storeInstance.state.promise || Promise.resolve()
    }).then(() => {
      if (to.matched.some(record => record.meta.requiresAuth)) {
        if (storeInstance.getters.isLoggedIn) {
          next()
          return
        }
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
    }).catch(() => {
      if (to.matched.some(record => record.meta.requiresAuth)) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
    })
  })
}

// Espejo del guard de main.js con la comprobación de términos (GDPR).
// Mantener sincronizado al tocar main.js.
//
// Ojo: la REGLA no se copia, se importa desde @/constants/terms. Lo único
// que se replica acá es el cableado del guard: el orden de los chequeos,
// el logout y la forma del next.
function runGuardWithTerms (to, storeInstance = store) {
  return new Promise((resolve) => {
    const next = jest.fn(arg => resolve(arg))
    storeInstance.dispatch('getLogginInfo').then(() => {
      return storeInstance.state.promise || Promise.resolve()
    }).then(() => {
      if (to.matched.some(record => record.meta.requiresAuth)) {
        if (storeInstance.getters.isLoggedIn) {
          if (needsTermsAcceptance(storeInstance.state.user)) {
            storeInstance.dispatch('logout')
              .catch(() => {})
              .finally(() => next({ name: 'Login', query: { redirect: to.fullPath } }))
            return
          }
          if (to.matched.some(record => record.meta.requiresAdmin)) {
            const u = storeInstance.state.user
            if (!u.support && !u.superadmin) {
              next({ name: 'Organizations' })
              return
            }
          }
          next()
          return
        }
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
    }).catch(() => {
      if (to.matched.some(record => record.meta.requiresAuth)) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else {
        next()
      }
    })
  })
}

const publicRoute = { fullPath: '/about', matched: [{ meta: {} }] }
const privateRoute = { fullPath: '/workspace/1', matched: [{ meta: { requiresAuth: true } }] }

describe('router guard (beforeEach)', () => {
  const Api = require('@/utils/Api').default

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    store.replaceState({ status: '', token: null, user: {}, isOnline: true, promise: null })
  })

  // ─── Secuencia correcta dispatch → state.promise ─────────────────────────────

  describe('sequencing: dispatch is awaited before state.promise is read', () => {
    it('resolves navigation even when state.promise is null before dispatch', async () => {
      // Simulates the race condition scenario: promise is null when guard fires.
      // getLogginInfo will set it synchronously via commit, but the guard must
      // wait for dispatch to finish before reading it.
      Api.post.mockResolvedValueOnce({ data: { status: 'active', access_token: 'tok' } })
      store.replaceState({ status: '', token: null, user: {}, isOnline: true, promise: null })

      const result = await runGuard(publicRoute)
      // next() was called (undefined = no redirect)
      expect(result).toBeUndefined()
    })

    it('does not throw when state.promise is null and status is empty', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'not_logged' } })
      store.replaceState({ status: '', token: null, user: {}, isOnline: true, promise: null })

      // Should resolve cleanly, not throw TypeError on null.then()
      await expect(runGuard(publicRoute)).resolves.not.toThrow()
    })
  })

  // ─── Rutas públicas ──────────────────────────────────────────────────────────

  describe('public routes', () => {
    it('calls next() without redirect when user is not logged in', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'not_logged' } })
      const result = await runGuard(publicRoute)
      expect(result).toBeUndefined()
    })

    it('calls next() without redirect when user is logged in', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'active', access_token: 'tok' } })
      const result = await runGuard(publicRoute)
      expect(result).toBeUndefined()
    })
  })

  // ─── Rutas privadas ──────────────────────────────────────────────────────────

  describe('private routes (requiresAuth)', () => {
    it('calls next() when user is logged in', async () => {
      store.replaceState({
        status: 'success',
        token: 'valid-token',
        user: { status: 'active' },
        isOnline: true,
        promise: null
      })
      const result = await runGuard(privateRoute)
      expect(result).toBeUndefined()
    })

    it('redirects to Login when user is not logged in', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'not_logged' } })
      const result = await runGuard(privateRoute)
      expect(result).toEqual({ name: 'Login', query: { redirect: '/workspace/1' } })
    })

    it('preserves the original path in the redirect query', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'not_logged' } })
      const route = { fullPath: '/workspace/org1/isoqf/42', matched: [{ meta: { requiresAuth: true } }] }
      const result = await runGuard(route)
      expect(result).toEqual({ name: 'Login', query: { redirect: '/workspace/org1/isoqf/42' } })
    })
  })

  // ─── Manejo de errores ───────────────────────────────────────────────────────

  describe('error handling (.catch branch)', () => {
    it('redirects to Login on error for private route', async () => {
      const networkError = new Error('Network Error')
      networkError.isOfflineError = true
      Api.post.mockRejectedValueOnce(networkError)
      // No user-data in localStorage → getLogginInfo will reject its promise
      localStorage.removeItem('user-data')

      const result = await runGuard(privateRoute)
      expect(result).toEqual({ name: 'Login', query: { redirect: '/workspace/1' } })
    })

    it('calls next() on error for public route', async () => {
      const networkError = new Error('Network Error')
      networkError.isOfflineError = true
      Api.post.mockRejectedValueOnce(networkError)
      localStorage.removeItem('user-data')

      const result = await runGuard(publicRoute)
      expect(result).toBeUndefined()
    })
  })
})

// ─── Guard de términos y condiciones (GDPR) ────────────────────────────────────

describe('guard de términos y condiciones', () => {
  const toLogin = { name: 'Login', query: { redirect: '/workspace/1' } }
  const adminRoute = {
    fullPath: '/workspace/1',
    matched: [{ meta: { requiresAuth: true, requiresAdmin: true } }]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    store.replaceState({ status: '', token: null, user: {}, isOnline: true, promise: null })
  })

  it('deja pasar al usuario que aceptó la versión vigente', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: true, terms_version: TERMS_VERSION })
    expect(await runGuardWithTerms(privateRoute)).toBeUndefined()
  })

  it('desvía a Login al usuario que nunca aceptó', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: false })
    expect(await runGuardWithTerms(privateRoute)).toEqual(toLogin)
  })

  it('desvía a Login al usuario con una versión anterior aceptada', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: true, terms_version: TERMS_VERSION - 1 })
    expect(await runGuardWithTerms(privateRoute)).toEqual(toLogin)
  })

  it('desvía a Login cuando el backend no manda terms_version (fail-closed)', async () => {
    // Éste es el caso que en producción decide si la obligación legal
    // se cumple o no. Sin fail-closed, undefined < 1 deja pasar a todos.
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: true })
    expect(await runGuardWithTerms(privateRoute)).toEqual(toLogin)
  })

  it('desvía a Login cuando el backend no manda ningún campo de términos', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok' })
    expect(await runGuardWithTerms(privateRoute)).toEqual(toLogin)
  })

  it('desvía a Login al usuario nuevo tal como lo devuelve el backend', async () => {
    // Forma exacta de un usuario que nunca aceptó, según models.py:38-39.
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: false, terms_version: 0 })
    expect(await runGuardWithTerms(privateRoute)).toEqual(toLogin)
  })

  it('cierra la sesión al desviar, no sólo redirige', async () => {
    // Sin el logout el usuario vuelve a Login con el token vivo y puede
    // saltarse el modal navegando a cualquier otra ruta privada.
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: false })
    await runGuardWithTerms(privateRoute)
    expect(store.getters.isLoggedIn).toBe(false)
  })

  it('no toca las rutas públicas', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: false })
    expect(await runGuardWithTerms(publicRoute)).toBeUndefined()
  })

  it('los términos mandan sobre el chequeo de admin', async () => {
    // Un superadmin sin términos aceptados va a Login, no a Organizations:
    // la obligación legal no depende del rol.
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', superadmin: true, terms_accepted: false })
    expect(await runGuardWithTerms(adminRoute)).toEqual(toLogin)
  })

  it('sigue mandando al no-admin a Organizations cuando sí aceptó', async () => {
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok', terms_accepted: true, terms_version: TERMS_VERSION })
    expect(await runGuardWithTerms(adminRoute)).toEqual({ name: 'Organizations' })
  })
})
