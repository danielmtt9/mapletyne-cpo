import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Render } from '@measured/puck'
import { puckConfig } from '../puck.config'
import { payloadClient } from '../lib/payload'

export const ReactLivePage: React.FC = () => {
  const params = useParams<{ slug?: string }>()
  const slug = params.slug || 'home'
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await payloadClient.getPage(slug)
        setPage(data)
      } catch (err) {
        console.error('Failed to load page:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading content...</div>
  }

  if (!page) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Page Not Found</h2>
        <p>No page found for slug "/{slug}".</p>
        <Link to="/">Go to Homepage</Link>
      </div>
    )
  }

  const puckData = page.puckData || { content: [], root: {} }

  return (
    <main style={{ minHeight: '100vh' }}>
      <Render config={puckConfig} data={puckData} />
    </main>
  )
}

export default ReactLivePage
