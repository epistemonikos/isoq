import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import editListHeader from '@/components/list/editListHeader.vue'
import en from '@/lang/en.json'

// #380: el enlace de vuelta a la tabla se lee solo y empieza con mayúscula.
const localVue = createLocalVue()
localVue.use(VueI18n)

describe('editListHeader — return link (#380)', () => {
  it('renders «Return to iSoQ table»', () => {
    const i18n = new VueI18n({ locale: 'en', messages: { en } })
    const wrapper = shallowMount(editListHeader, {
      localVue,
      i18n,
      propsData: { list: { id: 'l1' }, organizationId: 'o1', projectId: 'p1', name: 'F', mode: 'edit' },
      stubs: { 'b-container': true, 'b-row': true, 'b-col': true, 'b-link': { template: '<a class="return"><slot /></a>' }, 'font-awesome-icon': true, videoHelp: true }
    })
    expect(wrapper.find('a.return').text()).toBe('Return to iSoQ table')
  })
})
