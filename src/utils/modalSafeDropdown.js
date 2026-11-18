/**
 * b-dropdown props for a menu that may open inside a `scrollable` b-modal.
 *
 * In a scrollable modal the menu is a DOM child of `.modal-body`, which has
 * `overflow-y: auto`. With the default boundary (`scrollParent`) Popper pins the
 * menu inside that body and the body clips whatever does not fit: the last
 * options of the CAMELOT filter (#391) or the "Show all" row of the column
 * filter (#397) end up out of reach. Changing the boundary alone is not enough:
 * the menu is still clipped by its overflow ancestor.
 *
 * `positionFixed` makes the menu's containing block the viewport (a shown
 * `.modal-dialog` has no transform), so no overflow ancestor clips it. The
 * boundary must be `viewport` (the visible area), not `window`: in Popper v1
 * `window` is the whole document, so on a long, scrolled page (the worksheet)
 * the menu was allowed to open hundreds of pixels above the top of the screen.
 * Pair it with MODAL_SAFE_MENU_STYLE so a long menu scrolls inside itself.
 */
export const MODAL_SAFE_DROPDOWN = {
  boundary: 'viewport',
  popperOpts: { positionFixed: true },
  // Intrinsic width: see `.modal-safe-menu` in src/assets/styles/main.scss.
  menuClass: 'modal-safe-menu'
}

export const MODAL_SAFE_MENU_STYLE = {
  maxHeight: 'calc(100vh - 6rem)',
  overflowY: 'auto'
}
