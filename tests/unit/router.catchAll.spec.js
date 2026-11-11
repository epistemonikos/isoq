import routes from '@/router'
import { store } from '@/store'

const catchAll = () => routes[routes.length - 1]
const usuarioLogueado = { id: 'u1', status: 'active', access_token: 'tok', personal_organization: 'org-1' }

// Sin catch-all, una URL inexistente dejaba el router-view vacío: el usuario ve
// el encabezado y nada más, que se lee como un error de red y no como "esa
// dirección no existe".
describe('ruta catch-all', () => {
  afterEach(() => {
    store.commit('logout')
  })

  it('va última, para no comerse las rutas reales', () => {
    // vue-router resuelve por la PRIMERA coincidencia y '*' matchea todo, así
    // que ubicada antes dejaría la aplicación entera fuera de servicio.
    expect(catchAll().path).toBe('*')
    expect(routes.filter(r => r.path === '*')).toHaveLength(1)
  })

  it('manda al usuario con sesión a su espacio de trabajo', () => {
    store.commit('auth_success', usuarioLogueado)
    const next = jest.fn()

    catchAll().beforeEnter({}, {}, next)

    expect(next).toHaveBeenCalledWith({ name: 'viewOrganization', params: { id: 'org-1' } })
  })

  it('manda a la home al visitante sin sesión', () => {
    const next = jest.fn()

    catchAll().beforeEnter({}, {}, next)

    expect(next).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('manda a la home al usuario con sesión pero sin espacio personal', () => {
    // /workspace/undefined pediría los proyectos de una organización inexistente
    // y mostraría una lista vacía sin explicación.
    store.commit('auth_success', { id: 'u1', status: 'active', access_token: 'tok' })
    const next = jest.fn()

    catchAll().beforeEnter({}, {}, next)

    expect(next).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('cubre /workspaces, que dejó de ser una ruta propia', () => {
    expect(routes.find(r => r.path === '/workspaces')).toBeUndefined()
  })

  it('los dos destinos existen como rutas', () => {
    expect(routes.find(r => r.name === 'viewOrganization')).toBeDefined()
    expect(routes.find(r => r.name === 'MainPage')).toBeDefined()
  })
})
