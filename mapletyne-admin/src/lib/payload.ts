/**
 * Payload CMS Client SDK for Frontend Applications
 * Automatically queries multi-tenant pages, posts, documents, navigation, and settings.
 */

export interface PayloadClientConfig {
  baseUrl?: string
  apiKey?: string
  tenantId?: string | number
}

/**
 * Browser-safe environment variable accessor.
 * Prevents `ReferenceError: process is not defined` when this module is imported in the browser.
 */
function getSafeEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return String((import.meta as any).env[key])
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return String(process.env[key])
  }
  return ''
}

export function createPayloadClient(config: PayloadClientConfig = {}) {
  const baseUrl = (
    config.baseUrl ||
    getSafeEnv('PAYLOAD_SERVER_URL') ||
    getSafeEnv('NEXT_PUBLIC_PAYLOAD_URL') ||
    'https://payloadcms.mapletyne.com'
  ).replace(/\/+$/, '')

  const apiKey = config.apiKey || getSafeEnv('PAYLOAD_API_KEY') || getSafeEnv('NEXT_PUBLIC_PAYLOAD_API_KEY') || ''
  const tenantId = config.tenantId || getSafeEnv('TENANT_ID') || getSafeEnv('NEXT_PUBLIC_TENANT_ID') || ''

  const getHeaders = (extra: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extra }
    if (apiKey) {
      headers['Authorization'] = `users API-Key ${apiKey}`
    }
    return headers
  }

  return {
    baseUrl,
    tenantId,

    /**
     * Fetch a page by slug (defaults to 'home')
     */
    async getPage(slug = 'home', draft = false) {
      let url = `${baseUrl}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}`
      if (tenantId) url += `&where[tenant][equals]=${encodeURIComponent(tenantId)}`
      if (draft) url += `&draft=true`

      const res = await fetch(url, { headers: getHeaders(), cache: draft ? 'no-store' : 'default' })
      if (!res.ok) return null
      const data = await res.json()
      return data?.docs?.[0] || null
    },

    /**
     * Fetch all published posts with pagination & tag filtering
     */
    async getPosts(options: { page?: number; limit?: number; category?: string } = {}) {
      const page = options.page || 1
      const limit = options.limit || 10
      let url = `${baseUrl}/api/posts?page=${page}&limit=${limit}&sort=-publishedAt`
      if (tenantId) url += `&where[tenant][equals]=${encodeURIComponent(tenantId)}`
      if (options.category) url += `&where[category][equals]=${encodeURIComponent(options.category)}`

      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) return { docs: [], totalDocs: 0, totalPages: 0 }
      return res.json()
    },

    /**
     * Fetch a single post by slug
     */
    async getPostBySlug(slug: string, draft = false) {
      let url = `${baseUrl}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}`
      if (tenantId) url += `&where[tenant][equals]=${encodeURIComponent(tenantId)}`
      if (draft) url += `&draft=true`

      const res = await fetch(url, { headers: getHeaders(), cache: draft ? 'no-store' : 'default' })
      if (!res.ok) return null
      const data = await res.json()
      return data?.docs?.[0] || null
    },

    /**
     * Fetch navigation menus (header and footer)
     */
    async getNavigation() {
      let url = `${baseUrl}/api/navigation`
      if (tenantId) url += `?where[tenant][equals]=${encodeURIComponent(tenantId)}`

      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) return null
      const data = await res.json()
      return data?.docs?.[0] || null
    },

    /**
     * Fetch site brand settings (logos, branding, fonts, social links)
     */
    async getSiteSettings() {
      let url = `${baseUrl}/api/site-settings`
      if (tenantId) url += `?where[tenant][equals]=${encodeURIComponent(tenantId)}`

      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) return null
      const data = await res.json()
      return data?.docs?.[0] || null
    },

    /**
     * Fetch downloadable documents & whitepapers
     */
    async getDocuments(limit = 20) {
      let url = `${baseUrl}/api/documents?limit=${limit}&sort=-createdAt`
      if (tenantId) url += `&where[tenant][equals]=${encodeURIComponent(tenantId)}`

      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) return { docs: [] }
      return res.json()
    },
  }
}

export const payloadClient = createPayloadClient()
