import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import CamelotStepFourTable from '@/components/camelot/CamelotStepFourTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Una celda se escribe como 'A' (juicio sin explicar) o como ['A', 'porque X']
// (juicio explicado). La forma corta existe porque la mitad de los casos de acá
// son justamente celdas a medias.
const makeLeaf = (o) => Array.isArray(o)
  ? { option: o[0], text: o[1] }
  : { option: o, text: '' }

const makeItem = ({ s0 = [null, null, null, null], s1 = [null, null, null, null], s2 = [null], s3 = [null] } = {}) => ({
  ref_id: 'ref1',
  authors: 'Author 2024',
  stages: [
    { options: s0.map(makeLeaf) },
    { options: s1.map(makeLeaf) },
    { options: s2.map(makeLeaf) },
    { options: s3.map(makeLeaf) }
  ]
})

const EXPLAINED = (letters) => letters.map(l => [l, `explicación de ${l}`])

describe('CamelotStepFourTable.vue', () => {
  let wrapper
  const propsData = {
    fields: [
      { key: 'authors', label: 'Fit assessments' },
      { key: 'fa1', label: 'FA 1' }
    ],
    items: [makeItem({ s0: ['A', null, null, null] })],
    responses: [
      { text: 'No concerns', value: 'A', color: '#1065AB' }
    ]
  }

  beforeEach(() => {
    wrapper = shallowMount(CamelotStepFourTable, {
      localVue,
      propsData,
      mocks: {
        $t: (msg) => msg
      },
      stubs: {
        'font-awesome-icon': true
      }
    })
  })

  it('renders b-table', () => {
    expect(wrapper.find('b-table-stub').exists()).toBe(true)
  })

  it('emits open-modal event', () => {
    wrapper.vm.openModal(0, { index: 0, item: propsData.items[0] }, 1)
    expect(wrapper.emitted('open-modal')).toBeTruthy()
    expect(wrapper.emitted('open-modal')[0][0]).toEqual({
      stage: 0,
      data: { index: 0, item: propsData.items[0] },
      tab: 1,
      faLabel: null
    })
  })

  describe('openModal — ref lock guard', () => {
    it('NO emite open-modal cuando el estudio está lockeado por otro usuario', async () => {
      await wrapper.setProps({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }] })
      wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1' } })
      expect(wrapper.emitted('open-modal')).toBeFalsy()
    })

    it('NO emite open-modal cuando la fila no tiene ref_id', () => {
      wrapper.vm.openModal(0, { index: 0, item: { authors: 'X' } })
      expect(wrapper.emitted('open-modal')).toBeFalsy()
    })

    it('emite open-modal cuando el estudio no está lockeado y tiene ref_id', () => {
      wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1' } })
      expect(wrapper.emitted('open-modal')).toBeTruthy()
    })

    // This grid is what actually disables the Edit buttons, so it has to see a
    // study blocked through one of its cells — not just through the bare ref.
    it('NO emite open-modal cuando otro tiene bloqueada una celda del estudio', async () => {
      await wrapper.setProps({
        activeRefLocks: [{ ref_id: 'ref1::s1::o3', user_name: 'Ana' }]
      })
      wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1' } })
      expect(wrapper.emitted('open-modal')).toBeFalsy()
    })

    it('sí emite cuando el lock de celda es de otro estudio de nombre parecido', async () => {
      await wrapper.setProps({
        activeRefLocks: [{ ref_id: 'ref1X::s0::o0', user_name: 'Ana' }]
      })
      wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1' } })
      expect(wrapper.emitted('open-modal')).toBeTruthy()
    })

    it('nombra a quien tiene la celda en el tooltip del botón', async () => {
      await wrapper.setProps({
        activeRefLocks: [{ ref_id: 'ref1::s2::o0', user_name: 'Ana López' }]
      })
      expect(wrapper.vm.refLockedByName('ref1')).toBe('lock.ref_locked_by')
      expect(wrapper.vm.refLockedByName('ref9')).toBe('')
    })
  })

  // Un grupo "completo" es lo que la grilla certifica con el ✓ verde, y ese sello
  // dice que no queda nada por hacer en ese grupo. Un juicio sin explicación SÍ deja
  // algo por hacer: la explicación es lo que sostiene el juicio en el documento
  // final. El criterio es el único que hay — `isLeafComplete` — y no una variante
  // más floja para esta vista.
  describe('isGroupComplete', () => {
    it('returns false when item has no stages', () => {
      expect(wrapper.vm.isGroupComplete(0, 4, {})).toBe(false)
    })

    it('returns false when group is partially complete (FA1-FA4)', () => {
      const item = makeItem({ s0: EXPLAINED(['A', 'B']).concat([null, null]) })
      expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(false)
    })

    it('returns true when all 4 FA are judged AND explained (FA1-FA4)', () => {
      const item = makeItem({ s0: EXPLAINED(['A', 'B', 'C', 'D']) })
      expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(true)
    })

    it('returns false when group is partially complete (FA5-FA8)', () => {
      const item = makeItem({ s1: [['A', 'x'], null, ['C', 'x'], null] })
      expect(wrapper.vm.isGroupComplete(1, 4, item)).toBe(false)
    })

    it('returns true when all 4 FA are judged AND explained (FA5-FA8)', () => {
      const item = makeItem({ s1: EXPLAINED(['A', 'B', 'C', 'E']) })
      expect(wrapper.vm.isGroupComplete(1, 4, item)).toBe(true)
    })

    it('returns false when FA9 is not set', () => {
      const item = makeItem({ s2: [null] })
      expect(wrapper.vm.isGroupComplete(2, 1, item)).toBe(false)
    })

    it('returns true when FA9 is judged AND explained', () => {
      const item = makeItem({ s2: [['B', 'porque sí']] })
      expect(wrapper.vm.isGroupComplete(2, 1, item)).toBe(true)
    })

    it('returns false when OA is not set', () => {
      const item = makeItem({ s3: [null] })
      expect(wrapper.vm.isGroupComplete(3, 1, item)).toBe(false)
    })

    it('returns true when OA is judged AND explained', () => {
      const item = makeItem({ s3: [['A', 'porque sí']] })
      expect(wrapper.vm.isGroupComplete(3, 1, item)).toBe(true)
    })

    describe('la explicación es parte del criterio', () => {
      it('returns false cuando los 4 FA tienen juicio pero a uno le falta la explicación', () => {
        const item = makeItem({ s0: EXPLAINED(['A', 'B', 'C']).concat(['D']) })
        expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(false)
      })

      it('returns false cuando ninguno de los 4 FA tiene explicación', () => {
        const item = makeItem({ s0: ['A', 'B', 'C', 'D'] })
        expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(false)
      })

      it('returns false cuando la explicación es sólo espacios en blanco', () => {
        const item = makeItem({ s0: EXPLAINED(['A', 'B', 'C']).concat([['D', '   \n  ']]) })
        expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(false)
      })

      it('returns false para FA9 juzgado sin explicar', () => {
        expect(wrapper.vm.isGroupComplete(2, 1, makeItem({ s2: ['B'] }))).toBe(false)
      })

      it('returns false para la OA juzgada sin explicar', () => {
        expect(wrapper.vm.isGroupComplete(3, 1, makeItem({ s3: ['A'] }))).toBe(false)
      })

      // Documentos viejos que nunca escribieron `text`: no hay campo que mirar,
      // y eso no puede leerse como "explicado".
      it('returns false cuando la hoja legada no trae el campo text', () => {
        const item = makeItem({ s2: ['B'] })
        delete item.stages[2].options[0].text
        expect(wrapper.vm.isGroupComplete(2, 1, item)).toBe(false)
      })
    })
  })

  describe('canEdit gating (read-only user protection)', () => {
    function createWrapperWithEditColumn (canEdit) {
      return mount(CamelotStepFourTable, {
        localVue,
        propsData: {
          ...propsData,
          fields: [...propsData.fields, { key: 'edit1', label: '' }],
          canEdit
        },
        mocks: { $t: (msg) => msg },
        stubs: { 'font-awesome-icon': true }
      })
    }

    it('defaults canEdit to false when not provided', () => {
      expect(wrapper.vm.canEdit).toBe(false)
    })

    it('does not render the edit button when canEdit is false', () => {
      const readOnlyWrapper = createWrapperWithEditColumn(false)
      expect(readOnlyWrapper.find('.edit-btn').exists()).toBe(false)
    })

    it('renders the edit button when canEdit is true (regression)', () => {
      const editableWrapper = createWrapperWithEditColumn(true)
      expect(editableWrapper.find('.edit-btn').exists()).toBe(true)
    })
  })

  // CLAUDE.md: a green test over state does not prove it is drawn. These assert
  // the rendered grid, which is what the reviewer actually sees.
  describe('missing-explanation circle', () => {
    function mountGrid (items) {
      return mount(CamelotStepFourTable, {
        localVue,
        propsData: { ...propsData, items },
        mocks: { $t: (msg) => msg },
        stubs: { 'font-awesome-icon': { template: '<i class="fa-stub"></i>' } }
      })
    }

    it('draws an outlined circle with an exclamation mark for an assessment without explanation', () => {
      const grid = mountGrid([makeItem({ s0: ['A', null, null, null] })])
      const circle = grid.find('.assessment-circle.circle-incomplete')
      expect(circle.exists()).toBe(true)
      expect(circle.find('.fa-stub').exists()).toBe(true)
      expect(circle.attributes('title')).toBe('camelot.step_four.no_explanation')
    })

    it('draws a plain filled circle once the explanation is there', () => {
      const item = makeItem({ s0: ['A', null, null, null] })
      item.stages[0].options[0].text = 'Because of X'
      const grid = mountGrid([item])
      expect(grid.find('.assessment-circle.circle-incomplete').exists()).toBe(false)
      expect(grid.find('.assessment-circle.circle-filled').exists()).toBe(true)
    })

    it('still opens the modal when the incomplete circle is clicked', () => {
      const grid = mountGrid([makeItem({ s0: ['A', null, null, null] })])
      grid.find('.assessment-circle.circle-incomplete').trigger('click')
      expect(grid.emitted('open-modal')).toBeTruthy()
    })
  })

  // CLAUDE.md: si el dato termina en pantalla, la afirmación va sobre el DOM.
  // El ✓ es lo que el revisor mira para saber si le queda trabajo en ese grupo.
  describe('✓ del grupo — se dibuja sólo con las explicaciones puestas', () => {
    function mountGridWithEdit (items) {
      return mount(CamelotStepFourTable, {
        localVue,
        propsData: {
          ...propsData,
          fields: [...propsData.fields, { key: 'edit1', label: '' }],
          items,
          canEdit: true
        },
        mocks: { $t: (msg) => msg },
        stubs: { 'font-awesome-icon': { props: ['icon'], template: '<i class="fa-stub" :data-icon="icon"></i>' } }
      })
    }

    const ticks = (grid) => grid.findAll('.fa-stub').wrappers
      .filter(w => w.attributes('data-icon') === 'check')

    it('NO dibuja el ✓ cuando los 4 FA están juzgados pero sin explicación', () => {
      const grid = mountGridWithEdit([makeItem({ s0: ['A', 'B', 'C', 'D'] })])
      expect(ticks(grid)).toHaveLength(0)
    })

    it('NO dibuja el ✓ cuando falta la explicación de uno solo', () => {
      const grid = mountGridWithEdit([
        makeItem({ s0: EXPLAINED(['A', 'B', 'C']).concat(['D']) })
      ])
      expect(ticks(grid)).toHaveLength(0)
    })

    it('dibuja el ✓ cuando los 4 FA están juzgados y explicados', () => {
      const grid = mountGridWithEdit([makeItem({ s0: EXPLAINED(['A', 'B', 'C', 'D']) })])
      expect(ticks(grid)).toHaveLength(1)
    })
  })

  /**
   * La OA se emite «tomando en consideración» los nueve FA. Hasta que estén los nueve
   * —juicio Y explicación— su editor no se abre, y las dos puertas de esta grilla (el
   * botón y el círculo) tienen que decir lo mismo.
   */
  describe('el editor de la OA se abre recién con los nueve FA', () => {
    const NINE = {
      s0: EXPLAINED(['A', 'B', 'C', 'D']),
      s1: EXPLAINED(['A', 'B', 'C', 'D']),
      s2: EXPLAINED(['B'])
    }
    const GATE = 'camelot.step_four.oa_gate.blocked'

    /** Los nueve FA listos salvo FA9, que queda sin explicación. */
    const eightOfNine = () => makeItem({ ...NINE, s2: ['B'] })

    function mountGrid (items, overrides = {}) {
      return mount(CamelotStepFourTable, {
        localVue,
        propsData: {
          ...propsData,
          fields: [
            { key: 'authors', label: 'Fit assessments' },
            { key: 'fa1', label: 'FA 1' },
            { key: 'edit1', label: '' },
            { key: 'oa', label: 'OA' },
            { key: 'edit4', label: '' }
          ],
          items,
          canEdit: true,
          ...overrides
        },
        mocks: { $t: (msg) => msg },
        stubs: { 'font-awesome-icon': true }
      })
    }

    const oaButtonWrapper = grid => grid.findAll('td').at(4).find('span.d-inline-block')
    const oaButton = grid => grid.findAll('td').at(4).find('.edit-btn')
    const faButton = grid => grid.findAll('td').at(2).find('.edit-btn')
    const oaCircle = grid => grid.findAll('td').at(3).find('.assessment-circle')

    it('apaga el botón y explica qué falta cuando no hay ningún FA', () => {
      const grid = mountGrid([makeItem()])
      expect(oaButton(grid).attributes('disabled')).toBeTruthy()
      expect(oaButtonWrapper(grid).attributes('title')).toBe(GATE)
    })

    it('sigue apagado con ocho de los nueve FA listos', () => {
      const grid = mountGrid([eightOfNine()])
      expect(oaButton(grid).attributes('disabled')).toBeTruthy()
    })

    it('enciende el botón, sin aviso, con los nueve FA listos', () => {
      const grid = mountGrid([makeItem(NINE)])
      expect(oaButton(grid).attributes('disabled')).toBeFalsy()
      expect(oaButtonWrapper(grid).attributes('title')).toBe('')
    })

    it('deja entrar a una OA ya emitida aunque falten FA', () => {
      const grid = mountGrid([makeItem({ s3: ['C'] })])
      expect(oaButton(grid).attributes('disabled')).toBeFalsy()
    })

    it('no toca los botones de los FA en una fila con la OA bloqueada', () => {
      const grid = mountGrid([makeItem()])
      expect(faButton(grid).attributes('disabled')).toBeFalsy()
    })

    it('deja el círculo de la OA inerte y con el aviso', () => {
      const grid = mountGrid([makeItem()])
      expect(oaCircle(grid).classes()).not.toContain('is-clickable')
      expect(oaCircle(grid).attributes('title')).toBe(GATE)
    })

    it('devuelve el clic al círculo de la OA con los nueve FA listos', () => {
      const grid = mountGrid([makeItem(NINE)])
      expect(oaCircle(grid).classes()).toContain('is-clickable')
    })

    // La puerta única: el `disabled` es la señal, esto es el cierre.
    it('NO emite open-modal para la OA mientras falten FA', () => {
      const grid = mountGrid([makeItem()])
      grid.vm.openModal(3, { index: 0, item: makeItem() })
      expect(grid.emitted('open-modal')).toBeFalsy()
    })

    it('emite open-modal para la OA con los nueve FA listos', () => {
      const item = makeItem(NINE)
      const grid = mountGrid([item])
      grid.vm.openModal(3, { index: 0, item })
      expect(grid.emitted('open-modal')).toBeTruthy()
    })

    it('emite open-modal para los FA aunque la OA esté bloqueada', () => {
      const item = makeItem()
      const grid = mountGrid([item])
      grid.vm.openModal(0, { index: 0, item })
      expect(grid.emitted('open-modal')).toBeTruthy()
    })

    it('ignora el clic real sobre el círculo de la OA bloqueada', () => {
      const grid = mountGrid([makeItem()])
      oaCircle(grid).trigger('click')
      expect(grid.emitted('open-modal')).toBeFalsy()
    })

    // Dos motivos para el mismo botón apagado: el que le importa a la persona es que
    // otro lo tiene, porque ese no depende de ella.
    it('el lock ajeno le gana al aviso del gate', () => {
      const grid = mountGrid([makeItem()], {
        activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }]
      })
      expect(oaButtonWrapper(grid).attributes('title')).toBe('lock.ref_locked_by')
    })

    /**
     * Sin permiso de escritura no hay editor que proteger, y la etapa 3 es además la
     * única vista consolidada de los nueve FA. El círculo es la única puerta que le
     * queda a un lector: el botón ni siquiera se dibuja.
     */
    describe('el lector (canEdit=false) no queda afuera', () => {
      it('conserva el círculo clickeable con los FA incompletos', () => {
        const grid = mountGrid([makeItem()], { canEdit: false })
        expect(oaCircle(grid).classes()).toContain('is-clickable')
      })

      it('deja pasar open-modal de la OA', () => {
        const item = makeItem()
        const grid = mountGrid([item], { canEdit: false })
        grid.vm.openModal(3, { index: 0, item })
        expect(grid.emitted('open-modal')).toBeTruthy()
      })
    })
  })
})
