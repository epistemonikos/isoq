import { publicationCheckErrorKey } from '@/utils/publicationState'

jest.mock('@/utils/Api')

describe('publicationCheckErrorKey', () => {
  it('names the connection for an offline error', () => {
    const error = Object.assign(new Error('offline'), { isOfflineError: true })
    expect(publicationCheckErrorKey(error, 'notifications.save_error')).toBe('publish.check_needs_connection')
  })

  it('defers to writeErrorMessageKey for anything else', () => {
    expect(publicationCheckErrorKey(new Error('boom'), 'notifications.delete_error')).toBe('notifications.delete_error')
    expect(publicationCheckErrorKey({ response: { status: 403 } }, 'x')).toBe('notifications.write_forbidden')
  })
})
