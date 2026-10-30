import PublicPreviewAccess from '@/utils/publicPreviewAccess'

describe('PublicPreviewAccess', () => {
  describe('isBrowseToken', () => {
    it('returns true for the "public" sentinel used by /browse', () => {
      expect(PublicPreviewAccess.isBrowseToken('public')).toBe(true)
    })

    it('returns false for a real generated share token', () => {
      expect(PublicPreviewAccess.isBrowseToken('a1b2c3d4e5')).toBe(false)
    })

    it('returns false for an empty/undefined token', () => {
      expect(PublicPreviewAccess.isBrowseToken(undefined)).toBe(false)
      expect(PublicPreviewAccess.isBrowseToken('')).toBe(false)
    })
  })

  describe('isSharedLinkToken', () => {
    it('returns false for the "public" sentinel', () => {
      expect(PublicPreviewAccess.isSharedLinkToken('public')).toBe(false)
    })

    it('returns true for a real generated share token', () => {
      expect(PublicPreviewAccess.isSharedLinkToken('a1b2c3d4e5')).toBe(true)
    })

    it('returns false for an empty/undefined token', () => {
      expect(PublicPreviewAccess.isSharedLinkToken(undefined)).toBe(false)
      expect(PublicPreviewAccess.isSharedLinkToken('')).toBe(false)
    })
  })

  describe('canViewDetailedSections', () => {
    it('allows browse access only when public_type is fully', () => {
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'public', publicType: 'fully' })).toBe(true)
    })

    it('blocks browse access when public_type is partially', () => {
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'public', publicType: 'partially' })).toBe(false)
    })

    it('blocks browse access when public_type is minimally', () => {
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'public', publicType: 'minimally' })).toBe(false)
    })

    it('always allows access via a real shared-link token, regardless of public_type', () => {
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'a1b2c3d4e5', publicType: 'minimally' })).toBe(true)
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'a1b2c3d4e5', publicType: 'partially' })).toBe(true)
      expect(PublicPreviewAccess.canViewDetailedSections({ token: 'a1b2c3d4e5', publicType: 'private' })).toBe(true)
    })
  })

  describe('isAuthorized', () => {
    it('allows browse access when public_type is fully/partially/minimally', () => {
      expect(PublicPreviewAccess.isAuthorized({ token: 'public', publicType: 'fully' })).toBe(true)
      expect(PublicPreviewAccess.isAuthorized({ token: 'public', publicType: 'partially' })).toBe(true)
      expect(PublicPreviewAccess.isAuthorized({ token: 'public', publicType: 'minimally' })).toBe(true)
    })

    it('blocks browse access when public_type is private', () => {
      expect(PublicPreviewAccess.isAuthorized({ token: 'public', publicType: 'private' })).toBe(false)
    })

    it('always allows access via a real shared-link token, regardless of public_type', () => {
      expect(PublicPreviewAccess.isAuthorized({ token: 'a1b2c3d4e5', publicType: 'private' })).toBe(true)
    })
  })

  describe('resolveReturnRoute', () => {
    it('returns to previewContentSoQf for the browse flow, forwarding org/project ids', () => {
      const route = PublicPreviewAccess.resolveReturnRoute({
        token: 'public',
        project: { organization: 'org1', id: 'proj1' }
      })
      expect(route).toEqual({
        name: 'previewContentSoQf',
        params: { org_id: 'org1', isoqf_id: 'proj1', token: 'public' }
      })
    })

    it('returns to sharedContent for a real shared-link token', () => {
      const route = PublicPreviewAccess.resolveReturnRoute({
        token: 'a1b2c3d4e5',
        project: { organization: 'org1', id: 'proj1' }
      })
      expect(route).toEqual({
        name: 'sharedContent',
        params: { token: 'a1b2c3d4e5' }
      })
    })
  })
})
