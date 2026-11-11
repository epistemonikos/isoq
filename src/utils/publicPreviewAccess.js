const BROWSE_TOKEN = 'public'

export default class PublicPreviewAccess {
  static BROWSE_TOKEN = BROWSE_TOKEN

  static isBrowseToken (token) {
    return token === BROWSE_TOKEN
  }

  // Any non-'public' token is trusted as an already-authorized shared link: the
  // caller only reaches this component after the backend's /api/shared/{token}/...
  // endpoint accepted the token, so no client-side comparison against
  // project.sharedToken is needed (that comparison was the source of a prior bug,
  // since project isn't loaded yet at the point this decision has to be made).
  static isSharedLinkToken (token) {
    return !!token && token !== BROWSE_TOKEN
  }

  static canViewDetailedSections ({ token, publicType }) {
    if (PublicPreviewAccess.isSharedLinkToken(token)) {
      return true
    }
    return publicType === 'fully'
  }

  static resolveReturnRoute ({ token, project }) {
    if (PublicPreviewAccess.isBrowseToken(token)) {
      return {
        name: 'previewContentSoQf',
        params: { org_id: project.organization, isoqf_id: project.id, token }
      }
    }
    return { name: 'sharedContent', params: { token } }
  }

  static isAuthorized ({ token, publicType }) {
    if (PublicPreviewAccess.isSharedLinkToken(token)) {
      return true
    }
    return publicType !== 'private'
  }
}
