// Mock for Api module
export default {
  get: jest.fn(() => Promise.resolve({ data: { status: true, message: '' } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}
