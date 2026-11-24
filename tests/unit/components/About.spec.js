import { mount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import About from '@/components/About'
import en from '@/lang/en.json'

const localVue = createLocalVue()
localVue.use(VueI18n)

// Same ids as the table of contents on master, so links people already saved keep working.
const SECTIONS = [
  ['what-is-isoq', 'about.what_is_isoq'],
  ['what-is-grade-cerqual', 'about.what_is_gc'],
  ['when-to-use', 'about.when_use'],
  ['camelot', 'about.camelot'],
  ['replace-software', 'about.replace_software'],
  ['invite-collaborators', 'about.invite_collaborators'],
  ['export', 'about.export'],
  ['public', 'about.public'],
  ['mac-compatibility', 'about.mac'],
  ['funding', 'about.funding'],
  ['licence', 'about.licence'],
  ['cite', 'about.cite'],
  ['terms-and-conditions', 'about.terms']
]

const stubs = {
  'b-container': { template: '<div><slot /></div>' },
  'router-link': { props: ['to'], template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>' }
}

function build ({ hash = '' } = {}) {
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  const $router = {
    push: jest.fn(),
    replace: jest.fn(),
    resolve: jest.fn(location => ({ href: `#/about${location.hash}` }))
  }
  const wrapper = mount(About, {
    localVue,
    i18n,
    stubs,
    attachTo: document.body,
    mocks: { $route: { name: 'About', hash }, $router }
  })
  return { wrapper, $router }
}

const t = key => key.split('.').reduce((node, part) => node[part], en)

describe('About.vue', () => {
  let scrollIntoView

  beforeEach(() => {
    scrollIntoView = jest.fn()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('lists every section in the table of contents, in page order', () => {
    const { wrapper } = build()

    const entries = wrapper.findAll('[data-test="about-toc"] a').wrappers
    expect(entries.map(a => a.text())).toEqual(SECTIONS.map(([, key]) => t(key)))
    expect(wrapper.findAll('h3[id]').wrappers.map(h => h.attributes('id'))).toEqual(SECTIONS.map(([id]) => id))
  })

  it('links each entry to its section through the About route, so a copied link still opens the page', () => {
    const { wrapper } = build()

    const hrefs = wrapper.findAll('[data-test="about-toc"] a').wrappers.map(a => a.attributes('href'))
    expect(hrefs).toEqual(SECTIONS.map(([id]) => `#/about#${id}`))
  })

  it('explains CAMELOT with a link to the paper and the key points as a list (#418)', () => {
    const { wrapper } = build()

    const link = wrapper.find('a[href="https://onlinelibrary.wiley.com/doi/full/10.1002/cesm.12058"]')
    expect(link.text()).toBe('CAMELOT')
    expect(wrapper.text()).toContain(t('about.camelot_p2'))
    expect(wrapper.text()).toContain(t('about.camelot_key'))
    expect(wrapper.findAll('[data-test="camelot-key-points"] li').wrappers.map(li => li.text()))
      .toEqual([t('about.camelot_key_1'), t('about.camelot_key_2'), t('about.camelot_key_3')])
  })

  describe('with CAMELOT turned off in this installation (ENABLE_CAMELOT)', () => {
    let saved
    beforeEach(() => { saved = process.env.ENABLE_CAMELOT; process.env.ENABLE_CAMELOT = 'false' })
    afterEach(() => { process.env.ENABLE_CAMELOT = saved })

    it('hides the CAMELOT section and its table of contents entry', () => {
      const { wrapper } = build()

      expect(wrapper.find('h3#camelot').exists()).toBe(false)
      expect(wrapper.find('[data-test="camelot-key-points"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain(t('about.camelot_p2'))
      const entries = wrapper.findAll('[data-test="about-toc"] a').wrappers.map(a => a.text())
      expect(entries).toEqual(SECTIONS.filter(([id]) => id !== 'camelot').map(([, key]) => t(key)))
    })
  })

  it('scrolls to the section on click without navigating', async () => {
    // A plain href="#cite" is a route change in hash mode: the catch-all route would send the
    // reader to the home page, and any push jumps to the top (scrollBehavior).
    const { wrapper, $router } = build()

    await wrapper.find('[data-test="about-toc"] a[href="#/about#cite"]').trigger('click')

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0].id).toBe('cite')
    expect($router.push).not.toHaveBeenCalled()
    expect($router.replace).not.toHaveBeenCalled()
  })

  it('opens at the section named in the address', async () => {
    build({ hash: '#funding' })
    await new Promise(resolve => setTimeout(resolve))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0].id).toBe('funding')
  })

  it('points the Terms and Conditions section to the legal page (#374)', () => {
    const { wrapper } = build()

    const section = wrapper.find('#terms-and-conditions + p')
    expect(section.text()).toContain('Terms and conditions, the privacy policy and intellectual property information for iSoQ can be accessed')
    expect(JSON.parse(section.find('.router-link').attributes('data-to'))).toEqual({ name: 'PrivacyAndTerms' })
  })
})
