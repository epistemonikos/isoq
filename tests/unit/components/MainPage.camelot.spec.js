import { mount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import MainPage from '@/components/MainPage'
import en from '@/lang/en.json'

const localVue = createLocalVue()
localVue.use(VueI18n)

const stubs = {
  'b-container': { template: '<div><slot /></div>' },
  'b-row': { template: '<div><slot /></div>' },
  'b-col': { template: '<div><slot /></div>' },
  'b-img': { template: '<img />' },
  'b-link': { props: ['to', 'href'], template: '<a :data-to="JSON.stringify(to)" :href="href"><slot /></a>' },
  'router-link': { props: ['to'], template: '<a><slot /></a>' }
}

function build () {
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  return mount(MainPage, { localVue, i18n, stubs })
}

describe('MainPage — CAMELOT', () => {
  const original = process.env.ENABLE_CAMELOT
  afterEach(() => { process.env.ENABLE_CAMELOT = original })

  it('with CAMELOT off it looks as before: Version 1.0, no CAMELOT line or link', () => {
    process.env.ENABLE_CAMELOT = 'false'
    const w = build()
    expect(w.find('h2').text()).toContain('Version 1.0')
    expect(w.find('[data-test="home-camelot"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Learn more about CAMELOT in iSoQ')
    expect(w.findAll('#main-page-nav li')).toHaveLength(3)
  })

  it('with CAMELOT on it shows Version 2.0, "Now with CAMELOT" with its icon, and the About link last', () => {
    process.env.ENABLE_CAMELOT = 'true'
    const w = build()
    expect(w.find('h2').text()).toContain('Version 2.0')
    const line = w.find('[data-test="home-camelot"]')
    expect(line.text()).toBe('Now with CAMELOT')
    expect(line.find('img').exists()).toBe(true)
    const items = w.findAll('#main-page-nav li')
    expect(items).toHaveLength(4)
    const last = items.at(3).find('a')
    expect(last.text()).toBe('Learn more about CAMELOT in iSoQ')
    expect(JSON.parse(last.attributes('data-to'))).toEqual({ name: 'About', hash: '#camelot' })
  })
})
