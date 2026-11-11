// Same closed list of "on" values as isGdprEnabled (src/constants/gdpr.js).
const ENABLED_VALUES = ['true', 'on', true]

/**
 * Is CAMELOT offered in this installation?
 *
 * When off, an installation launches with the classic methodology only and enables CAMELOT later
 * with nothing more than a rebuild. What gets turned off is the entry point: choosing CAMELOT when
 * creating a project or switching an existing one to CAMELOT. A project that is already CAMELOT
 * keeps showing as such, because the rest of the app decides by `project.use_camelot`, and hiding
 * it would leave its Steps 3 and 4 with no view.
 *
 * Missing = off (the harmless mode). A build always defines it: the default lives in
 * config/prod.env.js.
 *
 * process.env is read on every call so tests can toggle it.
 *
 * @returns {boolean} true if CAMELOT can be chosen
 */
export function isCamelotEnabled () {
  return ENABLED_VALUES.includes(process.env.ENABLE_CAMELOT)
}
