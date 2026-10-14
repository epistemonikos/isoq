// La clave de una columna nueva la genera el cliente, y tiene que ser aleatoria.
//
// El backend soporta `PATCH .../field/<key>` como vía de alta con clave elegida por el
// cliente —lo necesitamos para que el alta sea idempotente y encolable offline— con una
// condición explícita: la clave debe ser aleatoria de ≥ 12 bytes, nada derivado del
// contenido, de la posición ni de un contador
// (docs/respuesta-backend-columnas-contrato-ejecucion.md §B1).
//
// Por qué la condición: `column_${max(N)+1}` colisionaba porque dos personas agregando a
// la vez leían el mismo `max(N)` y obtenían la misma clave, así que una pisaba a la otra.
// El problema era derivar la clave del contenido del documento, no que la generara el
// cliente. Lo que hay hoy en ManageColumnsButton.vue —`column_${Date.now()}_${random}`—
// tampoco sirve: dos clientes en el mismo milisegundo dependen sólo de Math.random.
import { newCustomFieldKey, isCustomField } from '@/utils/customFieldsHelper'

// La whitelist con la que el backend valida la escritura: sin match, 400.
const BACKEND_WHITELIST = /^column_[A-Za-z0-9_-]{1,64}$/

describe('newCustomFieldKey', () => {
  it('genera 24 hex con el prefijo column_', () => {
    expect(newCustomFieldKey()).toMatch(/^column_[0-9a-f]{24}$/)
  })

  it('pasa la whitelist de escritura del backend', () => {
    expect(newCustomFieldKey()).toMatch(BACKEND_WHITELIST)
  })

  it('la reconoce isCustomField, que es lo que filtra las columnas de usuario', () => {
    expect(isCustomField(newCustomFieldKey())).toBe(true)
  })

  // Si dos claves consecutivas coinciden, la clave no es aleatoria: es un contador o un
  // reloj, y dos usuarios agregando a la vez se pisan.
  it('no repite claves', () => {
    const claves = new Set()
    for (let i = 0; i < 500; i++) claves.add(newCustomFieldKey())
    expect(claves.size).toBe(500)
  })

  // La condición del backend es de entropía, no de formato: 24 hex fijos que sólo
  // varíen en los últimos dígitos pasarían el regex igual. 500 claves con el mismo
  // prefijo de 8 hex delatarían un reloj.
  it('varía en toda su extensión, no sólo en el final', () => {
    const prefijos = new Set()
    for (let i = 0; i < 500; i++) {
      prefijos.add(newCustomFieldKey().slice('column_'.length, 'column_'.length + 8))
    }
    expect(prefijos.size).toBeGreaterThan(450)
  })
})
