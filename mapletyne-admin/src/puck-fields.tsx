import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ALL_MATERIAL_SYMBOLS, POPULAR_MATERIAL_SYMBOLS } from './materialSymbolsList'
import { WHITELIST_FONTS, M3_COLOR_PRESETS } from './puck-constants'

// ==========================================
// 1. MATERIAL SYMBOLS ICON PICKER
// ==========================================

const CATEGORIES: Record<string, string[]> = {
  Popular: POPULAR_MATERIAL_SYMBOLS.slice(0, 36),
  Energy: ['bolt', 'electric_bolt', 'energy_savings_leaf', 'ev_station', 'solar_power', 'battery_charging_full', 'eco', 'speed', 'power', 'offline_bolt'],
  Business: ['domain', 'business', 'handshake', 'workspace_premium', 'analytics', 'bar_chart', 'trending_up', 'pie_chart', 'payments', 'credit_card'],
  Actions: ['search', 'menu', 'close', 'check', 'arrow_forward', 'arrow_back', 'launch', 'download', 'upload', 'refresh', 'sync', 'add', 'edit', 'delete'],
  Security: ['shield', 'lock', 'security', 'verified', 'verified_user', 'policy', 'vpn_key', 'admin_panel_settings'],
}

interface IconPickerProps {
  value?: string
  onChange: (val: string) => void
  name?: string
  label?: string
}

export function IconPicker({ value = 'star', onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('Popular')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ensure Material Symbols stylesheet is loaded in the current document (parent frame)
  useEffect(() => {
    if (!document.getElementById('material-symbols-font-head')) {
      const link = document.createElement('link')
      link.id = 'material-symbols-font-head'
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
      document.head.appendChild(link)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filtered symbols
  const displayedSymbols = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) {
      return ALL_MATERIAL_SYMBOLS.filter((s: string) => s.includes(q)).slice(0, 60)
    }
    return CATEGORIES[activeCategory] || POPULAR_MATERIAL_SYMBOLS.slice(0, 36)
  }, [search, activeCategory])

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '0.75rem' }} ref={dropdownRef}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      {/* Current Icon Input / Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}
          >
            {value || 'star'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || 'Select an icon...'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Google Material Symbol</div>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            padding: '10px',
            maxHeight: '360px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#94a3b8',
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search 4,200+ symbols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 8px 6px 32px',
                fontSize: '0.825rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Chips (shown when search is empty) */}
          {!search && (
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '6px' }}>
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: activeCategory === cat ? 600 : 400,
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: activeCategory === cat ? '#0284c7' : '#f1f5f9',
                    color: activeCategory === cat ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Icons Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '6px',
              overflowY: 'auto',
              maxHeight: '220px',
              padding: '2px',
            }}
          >
            {displayedSymbols.map((sym: string) => {
              const isSelected = value === sym
              return (
                <button
                  key={sym}
                  type="button"
                  title={sym}
                  onClick={() => {
                    onChange(sym)
                    setIsOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1',
                    borderRadius: '6px',
                    border: isSelected ? '1.5px solid #0284c7' : '1px solid transparent',
                    backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                    color: isSelected ? '#0369a1' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    padding: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#e2e8f0'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    {sym}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Manual Entry Bar */}
          <div
            style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '6px',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: '#64748b',
            }}
          >
            <span>Custom:</span>
            <input
              type="text"
              value={value || ''}
              placeholder="e.g. electric_car"
              onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
              style={{
                width: '120px',
                fontSize: '0.72rem',
                padding: '2px 6px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 2. FONT FAMILY PICKER
// ==========================================

export function FontPicker({ value = 'Inter', onChange, label }: { value?: string; onChange: (val: string) => void; label?: string }) {
  useEffect(() => {
    if (value && value !== 'Inter') {
      const id = `google-font-${value.replace(/\s+/g, '-').toLowerCase()}`
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${value.replace(/\s+/g, '+')}:wght@400;600;700;800&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [value])

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      <select
        value={value || 'Inter'}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: '0.85rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: WHITELIST_FONTS.find((f) => f.name === value)?.family || 'inherit',
        }}
      >
        {WHITELIST_FONTS.map((f) => (
          <option key={f.name} value={f.name} style={{ fontFamily: f.family }}>
            {f.name} - {f.description}
          </option>
        ))}
      </select>
    </div>
  )
}

// ==========================================
// 3. M3 COLOR PALETTE PICKER
// ==========================================

export function ColorPicker({ value = '#006874', onChange, label }: { value?: string; onChange: (val: string) => void; label?: string }) {
  const currentColor = value || '#006874'

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      {/* Palette Swatches */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
        {M3_COLOR_PRESETS.map((p) => {
          const isSelected = currentColor.toLowerCase() === p.hex.toLowerCase()
          return (
            <button
              key={p.hex}
              type="button"
              title={p.name}
              onClick={() => onChange(p.hex)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: p.hex,
                border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isSelected ? '0 0 0 2px #0284c7' : 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
            />
          )
        })}
      </div>

      {/* Custom Color Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '36px',
            height: '32px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: 0,
            background: 'none',
          }}
        />
        <input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#006874"
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '0.825rem',
            fontFamily: 'monospace',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            textTransform: 'uppercase',
          }}
        />
      </div>
    </div>
  )
}

// ==========================================
// 4. PAYLOAD CMS STRICT MEDIA LIBRARY PICKER
// ==========================================

interface MediaDoc {
  id: number | string
  url: string
  filename: string
  alt?: string
  width?: number
  height?: number
  filesize?: number
}

export function MediaPicker({ value = '', onChange, label }: { value?: string; onChange: (val: string) => void; label?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaList, setMediaList] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''))

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed (${res.statusText})`)
      }

      const json = await res.json()
      const newUrl = json.doc?.url || json.url
      if (newUrl) {
        onChange(newUrl)
        setIsOpen(false)
      } else {
        await fetchMedia()
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload asset to Payload CMS')
    } finally {
      setUploading(false)
    }
  }

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoints = [
        '/api/media?limit=50',
        'https://payloadcms.mapletyne.com/api/media?limit=50',
      ]
      let fetchedDocs: MediaDoc[] = []

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { credentials: 'omit' })
          if (res.ok) {
            const data = await res.json()
            if (data.docs && Array.isArray(data.docs)) {
              fetchedDocs = data.docs
              break
            }
          }
        } catch {
          // continue to next endpoint
        }
      }

      setMediaList(fetchedDocs)
      if (fetchedDocs.length === 0) {
        setError('No media uploaded in Payload CMS yet.')
      }
    } catch (err: any) {
      setError('Unable to connect to Payload Media API.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    fetchMedia()
  }

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          {label}
        </label>
      )}
      {/* Current Preview or Select Trigger */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={value}
              alt="Selected media"
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: '#1e293b', wordBreak: 'break-all' }}>
                {value.split('/').pop()}
              </div>
              <button
                type="button"
                onClick={handleOpen}
                style={{
                  fontSize: '0.72rem',
                  color: '#0284c7',
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Change Media
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove image"
              style={{
                border: 'none',
                background: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px dashed #94a3b8',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>image</span>
            Choose from Payload Media Library
          </button>
        )}
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>photo_library</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Payload CMS Media Library
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {/* Direct Upload Bar */}
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '22px' }}>upload_file</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    {uploading ? 'Uploading to Payload CMS...' : 'Upload Image from Computer'}
                  </span>
                </div>
                <label
                  style={{
                    padding: '7px 16px',
                    backgroundColor: uploading ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{uploading ? 'Uploading...' : 'Browse File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {uploadError && (
                <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.8rem' }}>
                  {uploadError}
                </div>
              )}
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1.5s linear infinite' }}>
                    progress_activity
                  </span>
                  <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>Loading Payload Media assets...</p>
                </div>
              )}

              {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600 }}>{error}</div>
                  <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                    Upload images in Payload CMS Admin at:
                    <a
                      href="https://payloadcms.mapletyne.com/admin/collections/media"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', marginLeft: '4px', textDecoration: 'underline' }}
                    >
                      /admin/collections/media
                    </a>
                  </div>
                </div>
              )}

              {!loading && mediaList.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {mediaList.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onChange(item.url)
                        setIsOpen(false)
                      }}
                      style={{
                        border: value === item.url ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.alt || item.filename}
                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '6px', fontSize: '0.72rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.filename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <a
                href="https://payloadcms.mapletyne.com/admin/collections/media"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem',
                  color: '#0284c7',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                <span>Upload New Assets in Payload</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>launch</span>
              </a>
              <button
                type="button"
                onClick={fetchMedia}
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
