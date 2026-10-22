import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { payloadClient } from '../lib/payload'

export const ReactPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await payloadClient.getPosts({ limit: 12 })
        setPosts(res?.docs || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading articles...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Latest Insights & Updates</h1>
        <p style={{ color: '#64748b' }}>Articles and publications managed via Payload CMS.</p>
      </header>

      {posts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>No articles published yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', margin: '0.5rem 0' }}>
                <Link to={`/posts/${post.slug}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && <p style={{ color: '#64748b' }}>{post.excerpt}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export const ReactPostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!slug) return
      try {
        const data = await payloadClient.getPostBySlug(slug)
        setPost(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading article...</div>
  if (!post) return <div style={{ padding: '3rem', textAlign: 'center' }}>Article not found.</div>

  return (
    <article style={{ maxWidth: '850px', margin: '0 auto', padding: '3.5rem 1.5rem', fontFamily: 'sans-serif' }}>
      <Link to="/posts" style={{ color: '#0284c7', textDecoration: 'none' }}>← Back to all articles</Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1rem 0' }}>{post.title}</h1>
      <p style={{ color: '#64748b' }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</p>
      <div style={{ lineHeight: 1.8, fontSize: '1.15rem', color: '#334155', marginTop: '2rem' }}>
        {typeof post.content === 'string' ? post.content : post.excerpt || 'Article content.'}
      </div>
    </article>
  )
}
