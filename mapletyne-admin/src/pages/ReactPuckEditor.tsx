import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'
import { puckConfig } from '../puck.config'

export interface ReactPuckEditorProps {
  cmsApiUrl?: string
}

export const ReactPuckEditor: React.FC<ReactPuckEditorProps> = ({
  cmsApiUrl = '/api/cms',
}) => {
  const { pageId } = useParams<{ pageId: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string>('Ready')

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = localStorage.getItem('opencpo_admin_jwt')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  useEffect(() => {
    async function fetchPage() {
      if (!pageId) return
      try {
        setLoading(true)
        const res = await fetch(`${cmsApiUrl}/pages/${pageId}?draft=true`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error(`Failed to load page (${res.status})`)
        const json = await res.json()
        let puck = json.puckData
        if (!puck || !Array.isArray(puck.content) || puck.content.length === 0) {
          const { synthesizePuckDataFromDoc } = await import('../lib/puckSync')
          puck = synthesizePuckDataFromDoc(json)
        }
        setData(puck || { content: [], root: {} })
        setSaveStatus('Ready')
      } catch (err) {
        console.error('Failed to load page in React Puck Editor:', err)
        setData({ content: [], root: {} })
        setSaveStatus('Error loading')
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [pageId, cmsApiUrl])

  const handleSaveDraft = async (updatedData: Data) => {
    if (!pageId) return
    setSaveStatus('Saving draft...')

    try {
      const res = await fetch(`${cmsApiUrl}/pages/${pageId}?draft=true`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ puckData: updatedData }),
      })
      if (res.ok) {
        setSaveStatus('Draft autosaved')
      } else {
        setSaveStatus('Error saving')
      }
    } catch {
      setSaveStatus('Network error')
    }
  }

  const handlePublish = async (updatedData: Data) => {
    if (!pageId) return
    setSaveStatus('Publishing...')

    try {
      const res = await fetch(`${cmsApiUrl}/pages/${pageId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          puckData: updatedData,
          _status: 'published',
        }),
      })

      if (res.ok) {
        setSaveStatus('Published!')
        alert('Page published successfully to Payload CMS!')
      } else {
        alert('Failed to publish page.')
        setSaveStatus('Error publishing')
      }
    } catch {
      alert('Network error publishing page.')
      setSaveStatus('Network error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#0284c7' }} aria-hidden="true">
            progress_activity
          </span>
          <p style={{ marginTop: '1rem', color: '#475569' }}>Loading Visual Editor for Page {pageId}...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          top: '12px',
          right: '180px',
          zIndex: 9999,
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: saveStatus.includes('Error') ? '#fee2e2' : '#f0fdf4',
          color: saveStatus.includes('Error') ? '#b91c1c' : '#15803d',
          border: '1px solid currentColor',
          pointerEvents: 'none',
        }}
      >
        {saveStatus}
      </div>
      <Puck
        config={puckConfig}
        data={data || { content: [], root: {} }}
        onPublish={handlePublish}
        onChange={handleSaveDraft}
        headerTitle="Visual Site Editor"
      />
    </div>
  )
}

export default ReactPuckEditor
