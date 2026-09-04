import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListEvidenceProfile from '@/components/list/editListEvidenceProfile.vue'
import LockService from '@/services/lockService'
import { EVIDENCE_PROFILE_SECTIONS } from '@/utils/evidenceProfileLockKeys'

// BootstrapVue instalado de verdad (no stubs de `b-table`) porque las aserciones
// que importan son sobre el DOM RENDERIZADO: con `b-table` stubbeada los
// `v-slot:cell(...)` no se ejecutan y el `<small>` nunca existe. El precedente de
// que esto funciona en este repo es `CamelotStepFourTable.spec.js`.
const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

const FINDING_ID = 'finding1'

const warn = () => ({ display_warning: false })
const UI_SHAPE = {
  methodological_limitations: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  methodological_assessments: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  coherence: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  adequacy: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  relevance: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  cerqual: { ...warn(), chars_of_studies: warn(), extracted_data: warn() }
}

// Un evidence profile con las cinco secciones completas: así se renderizan las
// ramas "ya completada" de los cinco botones, incluido el de cerqual (cuyo `v-if`
// exige que las cuatro dimensiones tengan opción).
function fullProfile () {
  const filled = { option: '1', explanation: 'texto', notes: '' }
  return [{
    displayNumber: 1,
    methodological_limitations: { ...filled },
    coherence: { ...filled },
    adequacy: { ...filled },
    relevance: { ...filled },
    cerqual: { ...filled },
    references: []
  }]
}

function createWrapper ({ activeRefLocks = [], permission = true, findings = { id: FINDING_ID } } = {}) {
  return mount(editListEvidenceProfile, {
    localVue,
    propsData: {
      evidenceProfile: fullProfile(),
      // La plantilla lee `ui.<seccion>.chars_of_studies.display_warning` sin
      // guardas, así que el objeto tiene que venir con la forma completa.
      ui: UI_SHAPE,
      evidenceProfileTableSettings: { isBusy: false },
      references: [],
      mode: 'edit',
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', cerqual: { option: null } },
      activeRefLocks,
      refsWithTitle: [],
      project: { id: 'proj1', organization: 'org1', review_question: 'q', inclusion: 'i', exclusion: 'e' },
      permission,
      selectOptions: [],
      levelConfidence: [],
      findings,
      methAssessments: { items: [] },
      extractedData: { id: 'ed1', fields: [], items: [] },
      showEditExtractedDataInPlace: { display: false, item: {} },
      modalData: {},
      charsOfStudies: { items: [] },
      show: { selected: ['ep'] },
      modePrintFieldObject: []
    },
    mocks: {
      $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $notify: { warning: jest.fn(), error: jest.fn(), success: jest.fn() },
      // `refLockStateMixin` lee `$store.state.user` para resolver el nombre propio.
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    },
    stubs: {
      videoHelp: true,
      'back-to-top': true,
      'evidence-profile-form': true,
      'font-awesome-icon': true
    }
  })
}

const foreignLock = (refId, userName = 'Ana Pérez') => ({ ref_id: refId, user_name: userName })

describe('editListEvidenceProfile — bloqueo visible de los assessments', () => {
  beforeEach(() => {
    LockService.refLocks.clear()
  })

  describe('estado', () => {
    it('un lock ajeno del finding bloquea las cinco secciones', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      EVIDENCE_PROFILE_SECTIONS.forEach(section => {
        expect(wrapper.vm.isSectionDisabled(section)).toBe(true)
      })
      wrapper.destroy()
    })

    it('sin locks no bloquea ninguna', () => {
      const wrapper = createWrapper({ activeRefLocks: [] })
      EVIDENCE_PROFILE_SECTIONS.forEach(section => {
        expect(wrapper.vm.isSectionDisabled(section)).toBe(false)
      })
      wrapper.destroy()
    })

    it('un lock propio de ESTA pestaña no bloquea', () => {
      // Primer camino del descarte: el registro local de LockService.
      LockService.refLocks.set(FINDING_ID, 'proj1')
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID, 'Cualquiera')] })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('un lock propio dejado en OTRA pestaña no bloquea', () => {
      // Segundo camino: la comparación por nombre. Sin ella, abrir la worksheet dos
      // veces se bloquea contra uno mismo, con el propio nombre en el cartel — un
      // bug que este repo ya derivó mal dos veces.
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID, 'Yo Mismo')] })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('un lock sin nombre no bloquea', () => {
      // Sin a quién nombrar el cartel quedaría mudo y los botones muertos.
      const wrapper = createWrapper({ activeRefLocks: [{ ref_id: FINDING_ID, user_name: null }] })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('un lock de otra entidad no bloquea', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock('otra-cosa')] })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('sin findings.id no bloquea nada', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)], findings: {} })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('una sección desconocida no bloquea', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      expect(wrapper.vm.isSectionDisabled('inventada')).toBe(false)
      wrapper.destroy()
    })

    it('sin permiso de escritura NO deshabilita: el botón dice View y ver no molesta', () => {
      const wrapper = createWrapper({
        activeRefLocks: [foreignLock(FINDING_ID)],
        permission: false
      })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('cuando el lock desaparece del sondeo, se rehabilita sin intervención', async () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(true)
      wrapper.setProps({ activeRefLocks: [] })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isSectionDisabled('coherence')).toBe(false)
      wrapper.destroy()
    })

    it('el nombre del cartel sale de la clave i18n con el usuario', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID, 'Ana Pérez')] })
      expect(wrapper.vm.sectionLockedByName('coherence'))
        .toBe('lock.ref_locked_by:{"user":"Ana Pérez"}')
      expect(wrapper.vm.sectionLockedByName('coherence')).toContain('Ana Pérez')
      wrapper.destroy()
    })

    it('sin lock el texto es vacío, no la clave sin interpolar', () => {
      const wrapper = createWrapper({ activeRefLocks: [] })
      expect(wrapper.vm.sectionLockedByName('coherence')).toBe('')
      wrapper.destroy()
    })

    it('editStageTwo no abre el modal si la sección está bloqueada', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      const emitted = jest.spyOn(wrapper.vm, '$emit')
      wrapper.vm.editStageTwo(fullProfile()[0], 'coherence')
      expect(emitted).not.toHaveBeenCalledWith('modalDataChanged', expect.anything())
      wrapper.destroy()
    })

    it('editStageTwo acepta la grafía con guión, igual que los @click', () => {
      // La tabla pasa 'methodological-limitations'; el markup habla en guión bajo.
      // Si el guard no normalizara, ese botón sería el único sin defensa.
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      const emitted = jest.spyOn(wrapper.vm, '$emit')
      wrapper.vm.editStageTwo(fullProfile()[0], 'methodological-limitations')
      expect(emitted).not.toHaveBeenCalledWith('modalDataChanged', expect.anything())
      wrapper.destroy()
    })
  })

  // ── DOM renderizado ───────────────────────────────────────────────────
  // Un test verde sobre el estado NO prueba que se vea: en este repo ya pasó dos
  // veces que un estado correcto no se dibujaba en ninguna rama de la plantilla, y
  // las dos pasaron revisión de código y suite. Si el dato termina en pantalla, la
  // afirmación va sobre el DOM.
  describe('DOM renderizado', () => {
    it('dibuja el aviso con el nombre visible, no sólo en el estado', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID, 'Ana Pérez')] })
      const aviso = wrapper.find('[data-testid="ep-locked-coherence"]')
      expect(aviso.exists()).toBe(true)
      expect(aviso.text()).toContain('Ana Pérez')
      wrapper.destroy()
    })

    it('los cinco avisos se dibujan — ninguna celda quedó sin el <small>', () => {
      // Son 10 sitios de botón casi idénticos y el riesgo real es dejar uno sin
      // markup al copiar y pegar. Ésta es la red que lo atrapa.
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      EVIDENCE_PROFILE_SECTIONS.forEach(section => {
        expect(wrapper.find(`[data-testid="ep-locked-${section}"]`).exists()).toBe(true)
      })
      wrapper.destroy()
    })

    it('sin lock no dibuja ningún aviso', () => {
      const wrapper = createWrapper({ activeRefLocks: [] })
      EVIDENCE_PROFILE_SECTIONS.forEach(section => {
        expect(wrapper.find(`[data-testid="ep-locked-${section}"]`).exists()).toBe(false)
      })
      wrapper.destroy()
    })

    it('los cinco botones de assessment quedan disabled en el DOM', () => {
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      const deshabilitados = wrapper.findAll('#assessments button').wrappers
        .filter(b => b.attributes('disabled') !== undefined)
      expect(deshabilitados).toHaveLength(EVIDENCE_PROFILE_SECTIONS.length)
      wrapper.destroy()
    })

    it('el botón de References NO se grisa, y es correcto que no', () => {
      // Su modal guarda por `Api.patch('/isoqf_lists/<id>')`, la ruta genérica, que
      // no pasa por @verify_ref_lock: el servidor no exige ningún ref-lock ahí. Es
      // Last-Write-Wins, un eje distinto y preexistente. Grisarlo inventaría una
      // restricción que el servidor no aplica — y este test está para que la cuenta
      // de arriba no se "arregle" grisándolo.
      const wrapper = createWrapper({ activeRefLocks: [foreignLock(FINDING_ID)] })
      const habilitados = wrapper.findAll('#assessments button').wrappers
        .filter(b => b.attributes('disabled') === undefined)
      expect(habilitados).toHaveLength(1)
      wrapper.destroy()
    })

    it('sin lock ningún botón de los assessments está disabled', () => {
      const wrapper = createWrapper({ activeRefLocks: [] })
      const deshabilitados = wrapper.findAll('#assessments button').wrappers
        .filter(b => b.attributes('disabled') !== undefined)
      expect(deshabilitados).toHaveLength(0)
      wrapper.destroy()
    })
  })
})
