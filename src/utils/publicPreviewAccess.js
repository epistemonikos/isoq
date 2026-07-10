const BROWSE_TOKEN = 'public'

export default class PublicPreviewAccess {
  static BROWSE_TOKEN = BROWSE_TOKEN

  static isBrowseToken (token) {
    return token === BROWSE_TOKEN
  }

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
