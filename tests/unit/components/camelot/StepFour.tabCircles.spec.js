import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import { emptyAssessmentItem } from '@/utils/camelotAssessmentKeys'

/**
 * El círculo del título de cada pestaña del modal del Paso 4 dice en qué estado está
 * ese meta-dominio. Tiene que hablar el MISMO idioma que la grilla: un juicio sin
 * explicación no es una celda terminada, pero tampoco es una celda vacía — pintarlo
 * como vacío borraría el nivel que la persona ya eligió.
 */
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/editorPresence', () => ({
  announcePresence: jest.fn(),
  clearPresence: jest.fn(),
  otherTabActiveOn: jest.fn().mockReturnValue(false)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      isEnabled: true,
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map(),
      get refLocked () { return this.refLocks.size > 0 }
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const ITEM = { index: 0, item: { ref_id: 'R1', authors: 'Autor 2020' } }

/** Un estudio con la etapa 0 (FA 1-4) en el estado que pida el test. */
function studyWithStageZero (cells) {
  const item = emptyAssessmentItem('R1', 'Autor 2020')
  cells.forEach(([option, text], i) => {
    item.stages[0].options[i].option = option
    item.stages[0].options[i].text = text
  })
  return { id: 'assess1', items: [item] }
}

/** Los círculos de los títulos de las cuatro pestañas, en orden. */
function tabCircles () {
  return [...document.body.querySelectorAll('.modal-nav-tabs .assessment-circle')]
}

describe('StepFour — círculo del título de cada pestaña', () => {
  let wrapper

  async function openedModal (assessments) {
    wrapper = mount(StepFour, {
      localVue,
      attachTo: document.body,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks: {
        $t: key => key,
        $route: { params: { id: 'proj1', org_id: 'org1' } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
        $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
      }
    })
    await flushPromises()
    wrapper.setData({ assessments })
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    document.body.innerHTML = ''
  })

  it('dibuja un círculo vacío (punteado, sin relleno) para el meta-dominio sin juzgar', async () => {
    await openedModal(studyWithStageZero([]))
    const circles = tabCircles()
    expect(circles).toHaveLength(4)
    expect(circles[0].className).toContain('circle-not-completed')
  })

  it('NO da por terminado el meta-dominio juzgado al que le falta la explicación', async () => {
    await openedModal(studyWithStageZero([['B', '']]))
    const circle = tabCircles()[0]
    expect(circle.className).not.toContain('circle-filled')
    expect(circle.className).toContain('circle-incomplete')
  })

  // El nivel elegido no se pierde: la persona ya lo eligió, y borrarlo de la pestaña
  // la obligaría a abrirla para recordar qué había puesto.
  it('conserva el color del nivel en la celda a medias, y le agrega el signo de admiración', async () => {
    await openedModal(studyWithStageZero([['B', '   ']]))
    const circle = tabCircles()[0]
    expect(circle.getAttribute('style')).toContain('background-color')
    expect(circle.querySelector('.circle-warning-icon')).not.toBeNull()
  })

  it('dibuja el círculo lleno y liso cuando hay juicio Y explicación', async () => {
    await openedModal(studyWithStageZero([['B', 'porque X']]))
    const circle = tabCircles()[0]
    expect(circle.className).toContain('circle-filled')
    expect(circle.querySelector('.circle-warning-icon')).toBeNull()
  })

  it('cada pestaña lee su propio meta-dominio', async () => {
    await openedModal(studyWithStageZero([['B', 'ok'], ['C', ''], [null, '']]))
    const circles = tabCircles()
    expect(circles[0].className).toContain('circle-filled')
    expect(circles[1].className).toContain('circle-incomplete')
    expect(circles[2].className).toContain('circle-not-completed')
  })
})
