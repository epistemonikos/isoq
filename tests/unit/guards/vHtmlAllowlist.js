/**
 * Every `v-html` in src/, and why it cannot carry text that a person typed.
 *
 * `v-html` puts a string into the page as HTML. If any part of it comes from a user (a
 * finding name, a project title, a reference) and is not escaped, that user can run script
 * in the session of whoever views it, and the session token lives in localStorage. vue-i18n 8
 * does NOT escape `$t` parameters, so `v-html="$t(key, { name })"` is exactly that hole
 * (the finding-name XSS, 2026-10-30).
 *
 * Before adding an entry, ask: can any part of this string come from the database or the
 * URL? If yes, it does not go here: render it with `{{ }}`, or with `<i18n>` component
 * interpolation when a translated sentence wraps it.
 */
const STATIC_I18N = 'A fixed translation from src/lang/*.json with no parameters: the HTML is ours.'
const NUMBER_PARAM = 'Translation whose only parameter is an array length (a number), so it cannot carry markup.'
const CAMELOT_TEXT = 'Fixed CAMELOT method text from src/lang/*.json, chosen by a stage or domain index, never by user input.'

module.exports = {
  'components/camelot/CamelotStepFourHeader.vue::$t(\'camelot.step_four.how_to_read.content_1\')': STATIC_I18N,
  'components/camelot/CamelotStepFourHeader.vue::$t(\'camelot.step_four.how_to_read.content_3\')': STATIC_I18N,
  'components/camelot/CamelotStepFourHeader.vue::$t(\'camelot.step_four.how_to_read.content_4\')': STATIC_I18N,
  'components/camelot/CustomFieldsManager.vue::guidanceContent.definition': CAMELOT_TEXT + ' (`camelot.guidance.<field>`, the field comes from a fixed domainMap).',
  'components/camelot/CustomFieldsManager.vue::guidanceContent.what_to_do': CAMELOT_TEXT + ' (`camelot.guidance.<field>`, the field comes from a fixed domainMap).',
  'components/camelot/CustomFieldsManager.vue::guidanceContent.tips': CAMELOT_TEXT + ' (`camelot.guidance.<field>`, the field comes from a fixed domainMap).',
  'components/camelot/CustomFieldsManager.vue::guidanceContent.examples': CAMELOT_TEXT + ' (`camelot.guidance.<field>`, the field comes from a fixed domainMap).',
  'components/camelot/StepFour.vue::helpContent[modal.stage]': CAMELOT_TEXT + ' (`camelot.step_four.help_modal.<0-3>`).',
  'components/camelot/assessment/AssessmentForm.vue::options[modalStage][selectedMeta].text': CAMELOT_TEXT + ' (the prompts built in data() from `camelot.assessment_form.prompts.*`).',
  'components/camelot/assessment/CamelotAssessmentSummaryTable.vue::getAssessmentLabel(stageIdx, oIdx)': CAMELOT_TEXT + ' (getAssessmentLabel picks a `camelot_assessment_summary_table.*` key by index).',
  'components/legal/LegalDocument.vue::inline(part.intro)': 'Legal package text, and legalInline escapes it before adding <strong> and the placeholder marks.',
  'components/legal/LegalDocument.vue::inline(item)': 'Legal package text, and legalInline escapes it before adding <strong> and the placeholder marks.',
  'components/legal/LegalDocument.vue::inline(cell)': 'Legal package text, and legalInline escapes it before adding <strong> and the placeholder marks.',
  'components/legal/LegalDocument.vue::inline(block.text)': 'Legal package text, and legalInline escapes it before adding <strong> and the placeholder marks.',
  'components/legal/LegalDocument.vue::inline(item.a)': 'Legal package text (the answer of an open question), and legalInline escapes it before adding <strong> and the placeholder marks.',
  'components/list/editListEvidenceProfile.vue::$t(\'soqf_table.refs_count\', {count: data.item.references.length})': NUMBER_PARAM,
  'components/list/editListEvidenceProfile.vue::$t(\'soqf_table.remove_ref_warning\')': STATIC_I18N,
  'components/organization/organizationForm.vue::$t(\'project.camelot_modal_info.link1\')': STATIC_I18N,
  'components/organization/organizationForm.vue::$t(\'project.camelot_modal_info.link2\')': STATIC_I18N,
  'components/project/InclusionExclusionCriteria.vue::$t(\'inclusion.step_title\')': STATIC_I18N,
  'components/project/PublishModal.vue::errorsResponse.message': 'The `message` of GET /api/project/can_publish (server checkIfCanPublish). Its messages are fixed English strings; the only one with HTML is the Project Properties link of checkBasicInformation, whose variable parts are the project and organization ids. If the server ever puts a name or a title in that message, this entry must go.',
  'components/project/UploadReferences.vue::$t(\'references.step_title\')': STATIC_I18N,
  'components/project/UploadReferences.vue::$t(\'references.references_loaded\', { count: references.length })': NUMBER_PARAM,
  'components/project/UploadReferences.vue::$t(\'references.delete_all_warning\')': STATIC_I18N,
  'components/project/ViewTable.vue::$t(\'soqf_table.refs_count\', { count: data.item.raw_ref.length })': NUMBER_PARAM,
  'components/project/viewProject.vue::$t(\'characteristics.step_title\')': STATIC_I18N,
  'components/project/viewProject.vue::$t(\'characteristics.step_title_camelot\')': STATIC_I18N,
  'components/project/viewProject.vue::formattedCamelotDescription': 'Fixed `camelot.step_three.description` with `{icon}` replaced by an <img> of the bundled CAMELOT logo.',
  'components/project/viewProject.vue::$t(\'steps.step_4_description_camelot\')': STATIC_I18N,
  'components/project/viewProject.vue::$t(\'steps.step_4_description\')': STATIC_I18N,
  'components/project/viewProject.vue::$t(\'camelot.step_four.description\')': STATIC_I18N
}
