import { Packer, Document } from 'docx'
import { buildFooter, footerTexts, licenseLabel } from '@/utils/wordFooter'
import { publicProjectUrl } from '@/utils/publicPreviewAccess'

const t = k => k

describe('footerTexts', () => {
  it('public project: its license, as cited («CC BY-SA»)', () => {
    expect(footerTexts({ name: 'P', public_type: 'fully', license_type: 'CC-BY-SA' }, t))
      .toEqual(expect.objectContaining({ left: 'P', right: 'actionButtons.word_export.footer_license: CC BY-SA' }))
  })

  it('decides with the canonical rule (isProjectPublic), not the stored is_public', () => {
    const base = { name: 'P', license_type: 'CC-BY-SA' }
    expect(footerTexts({ ...base, public_type: 'fully', private: true, is_public: false }, t).right)
      .toContain('CC BY-SA')
    expect(footerTexts({ ...base, public_type: 'private', is_public: true }, t).right)
      .toBe('')
  })

  it('public without a stored license: the default (effectiveLicense)', () => {
    expect(footerTexts({ name: 'P', public_type: 'partially', license_type: '' }, t).right)
      .toContain('CC BY-NC-ND')
  })

  it('with a finding number: «Project — Finding N»', () => {
    expect(footerTexts({ name: 'P', public_type: 'private' }, t, 4).left)
      .toBe('P — actionButtons.word_export.footer_finding 4')
  })

  it('licenseLabel', () => {
    expect(licenseLabel('CC-BY-NC-ND')).toBe('CC BY-NC-ND')
  })

  // #416 (Megan): un proyecto no publicado no lleva ni licencia ni aviso.
  it('private project: nothing on the right but the page number', () => {
    expect(footerTexts({ name: 'P', public_type: 'private', license_type: 'CC-BY' }, t))
      .toEqual({ left: 'P', right: '', link: '' })
  })

  // #416 (Megan): el pie de un proyecto publicado lleva el enlace a su página pública.
  it('public project: the link to its public page', () => {
    const project = { id: 'p1', organization: 'o1', name: 'P', public_type: 'fully' }
    expect(footerTexts(project, t).link).toBe(publicProjectUrl(project))
  })

  it('private project: no link', () => {
    expect(footerTexts({ id: 'p1', organization: 'o1', name: 'P', public_type: 'private' }, t).link).toBe('')
  })
})

describe('publicProjectUrl', () => {
  it('the public (Browse) view of the project, absolute', () => {
    expect(publicProjectUrl({ id: 'p1', organization: 'o1' }, 'https://isoq.example'))
      .toBe('https://isoq.example/#/preview/isoq/o1/p1/public')
  })

  it('without id or organization there is no link', () => {
    expect(publicProjectUrl({ id: 'p1' }, 'https://isoq.example')).toBe('')
  })
})

// Lo que importa es lo que queda en el .docx, no el objeto intermedio.
describe('buildFooter, in the generated document', () => {
  async function footerXml (texts) {
    const doc = new Document({
      sections: [{ properties: {}, footers: { default: buildFooter(texts, undefined, t) }, children: [] }]
    })
    const JSZip = require('jszip')
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
    const name = Object.keys(zip.files).find(f => /word\/footer\d*\.xml$/.test(f))
    const rels = Object.keys(zip.files).find(f => /word\/_rels\/footer\d*\.xml\.rels$/.test(f))
    return {
      xml: await zip.file(name).async('string'),
      rels: rels ? await zip.file(rels).async('string') : ''
    }
  }

  it('public: license, page and a real hyperlink to the project', async () => {
    const { xml, rels } = await footerXml({ left: 'P', right: 'License: CC BY', link: 'https://isoq.example/#/preview/isoq/o1/p1/public' })
    expect(xml).toContain('License: CC BY · ')
    expect(xml).toContain('<w:hyperlink')
    expect(xml).toContain('https://isoq.example/#/preview/isoq/o1/p1/public')
    expect(rels).toContain('Target="https://isoq.example/#/preview/isoq/o1/p1/public"')
  })

  it('private: no separator before the page, no hyperlink', async () => {
    const { xml } = await footerXml({ left: 'P', right: '', link: '' })
    expect(xml).not.toContain(' · ')
    expect(xml).not.toContain('<w:hyperlink')
  })
})
