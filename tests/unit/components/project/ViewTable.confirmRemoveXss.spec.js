import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import ViewTable from '@/components/project/ViewTable.vue'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

jest.mock('@/utils/Api')

/**
 * Stored XSS through the finding name (found 2026-10-30).
 *
 * The "remove finding" modal rendered `$t('soqf_table.confirm_remove', { name })` with
 * `v-html`. vue-i18n 8 does not escape parameters, and any collaborator with `can_write`
 * chooses the name. A name like `<img onerror=…>` ran script in the session of whoever
 * opened the modal, and the session token lives in localStorage.
 *
 * This needs a real VueI18n: the `$t: key => key` mock of ViewTable.spec.js drops the
 * parameter, so the payload never reaches the DOM and the test would pass on the bug.
 */
const localVue = createLocalVue()
localVue.use(VueI18n)
// shallowMount would stub <i18n> too, and the stub renders only the slot: the sentence
// around the name would vanish and the text assertions would test nothing.
const I18nInterpolation = localVue.options.components.i18n

const PAYLOAD = '<img src=x onerror="window.__xss = true">'

function mountIn (locale) {
  const i18n = new VueI18n({ locale, fallbackLocale: 'en', messages: { en, es, pt } })
  return shallowMount(ViewTable, {
    localVue,
    i18n,
    propsData: {
      lists: [],
      list_categories: { options: [], selected: null },
      fields: { with_categories: [], without_categories: [] },
      project: { id: 'proj1', is_public: false, private: true },
      references: [],
      refs: [],
      isBusy: false,
      mode: 'edit',
      canEdit: true
    },
    mocks: {
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: { videoHelp: true, i18n: I18nInterpolation }
  })
}

describe('ViewTable.vue — the remove-finding modal shows the name as text', () => {
  afterEach(() => {
    delete window.__xss
  })

  it.each(['en', 'es', 'pt'])('%s: a name with HTML is not rendered as HTML', async (locale) => {
    const wrapper = mountIn(locale)
    await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, name: PAYLOAD } })

    const modal = wrapper.find('#remove-finding')
    expect(modal.findAll('img').length).toBe(0)

    const bold = modal.find('b')
    expect(bold.exists()).toBe(true)
    expect(bold.text()).toBe(PAYLOAD)
  })

  it.each([
    ['en', 'Confirm you want to remove', 'from the iSoQ table?'],
    ['es', '¿Confirma que desea eliminar', 'de la tabla iSoQ?'],
    ['pt', 'Confirma que deseja remover', 'da tabela iSoQ?']
  ])('%s: the sentence around the name is still complete', async (locale, before, after) => {
    const wrapper = mountIn(locale)
    await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, name: 'Finding One' } })

    const text = wrapper.find('#remove-finding').text().replace(/\s+/g, ' ')
    expect(text).toContain(`${before} Finding One ${after}`)
    expect(text).not.toContain('<b>')
  })
})
