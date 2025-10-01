import { apiClient } from '../api'

// Mock fetch globally
global.fetch = jest.fn()
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

describe('API Client', () => {
  beforeEach(() => {
    mockedFetch.mockClear()
  })

  describe('getCampaigns', () => {
    it('should fetch campaigns successfully', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Test Campaign', status: 'active' },
          { id: 2, name: 'Another Campaign', status: 'paused' }
        ],
        pagination: { page: 1, limit: 12, total: 2, hasMore: false, nextCursor: null }
      }

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.getCampaigns()

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/campaigns',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle query parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 2, limit: 5, total: 0, hasMore: false, nextCursor: null }
      }

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response)

      await apiClient.getCampaigns({ page: 2, limit: 5, cursor: 123 })

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/campaigns?page=2&limit=5&cursor=123',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should throw error on failed request', async () => {
      const errorResponse = { error: 'Internal Server Error' }

      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => errorResponse,
      } as Response)

      await expect(apiClient.getCampaigns()).rejects.toThrow('Internal Server Error')
    })

    it('should handle network errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getCampaigns()).rejects.toThrow('Network error')
    })
  })

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      const newCampaign = {
        name: 'New Campaign',
        description: 'Test description',
        defaultLanguage: 'en',
        targetLanguages: ['es', 'fr']
      }

      const mockResponse = {
        id: 123,
        ...newCampaign,
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.createCampaign(newCampaign)

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/campaigns',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newCampaign),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('error handling', () => {
    it('should handle malformed JSON error response', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => { throw new Error('Invalid JSON') },
      } as unknown as Response)

      await expect(apiClient.getCampaigns()).rejects.toThrow('HTTP error! status: 500')
    })

    it('should provide default error message', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response)

      await expect(apiClient.getCampaigns()).rejects.toThrow('HTTP error! status: 404')
    })
  })
})