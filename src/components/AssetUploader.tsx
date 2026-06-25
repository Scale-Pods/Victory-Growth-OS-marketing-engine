import { useRef, useState, useCallback } from 'react'
import { Upload, X, FileText, Image, Film, ExternalLink, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface AssetItem {
  name: string
  url: string
  path: string
  type: string
  size: number
}

interface Props {
  profileId: string
  value: string   // JSON-encoded AssetItem[]
  onChange: (json: string) => void
  disabled?: boolean
}

function parseAssets(value: string): AssetItem[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Film
  return FileText
}

export default function AssetUploader({ profileId, value, onChange, disabled }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<Record<string, number>>({})  // filename → progress 0-100
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const assets = parseAssets(value)

  const upload = useCallback(async (files: File[]) => {
    if (!profileId || files.length === 0) return
    setError(null)
    for (const file of files) {
      const key = `${file.name}-${Date.now()}`
      setUploading((u) => ({ ...u, [key]: 0 }))
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${profileId}/${Date.now()}-${safeName}`
      try {
        const { error: upErr } = await supabase.storage
          .from('business-assets')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage
          .from('business-assets')
          .getPublicUrl(path)
        const item: AssetItem = { name: file.name, url: publicUrl, path, type: file.type, size: file.size }
        onChange(JSON.stringify([...parseAssets(value), item]))
        // re-read latest value via functional update is not possible here — accumulate below
      } catch (e: any) {
        setError(`Failed to upload ${file.name}: ${e.message}`)
      } finally {
        setUploading((u) => { const next = { ...u }; delete next[key]; return next })
      }
    }
  }, [profileId, value, onChange])

  // Accumulate multiple uploads properly
  const uploadBatch = useCallback(async (files: File[]) => {
    if (!profileId || files.length === 0) return
    setError(null)
    const newItems: AssetItem[] = []
    const pending = files.map((f) => ({ file: f, key: `${f.name}-${Date.now()}` }))
    setUploading((u) => {
      const next = { ...u }
      pending.forEach(({ key }) => { next[key] = 0 })
      return next
    })
    for (const { file, key } of pending) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${profileId}/${Date.now()}-${safeName}`
      try {
        const { error: upErr } = await supabase.storage
          .from('business-assets')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage
          .from('business-assets')
          .getPublicUrl(path)
        newItems.push({ name: file.name, url: publicUrl, path, type: file.type, size: file.size })
      } catch (e: any) {
        setError(`Failed to upload ${file.name}: ${e.message}`)
      } finally {
        setUploading((u) => { const next = { ...u }; delete next[key]; return next })
      }
    }
    if (newItems.length) onChange(JSON.stringify([...parseAssets(value), ...newItems]))
  }, [profileId, value, onChange])

  async function remove(item: AssetItem) {
    try {
      await supabase.storage.from('business-assets').remove([item.path])
    } catch {}
    onChange(JSON.stringify(assets.filter((a) => a.path !== item.path)))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    uploadBatch(files)
  }, [disabled, uploadBatch])

  const isUploading = Object.keys(uploading).length > 0

  if (disabled) {
    if (assets.length === 0) return <span style={{ color: 'var(--label-tertiary)' }}>—</span>
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {assets.map((a) => {
          const Icon = fileIcon(a.type)
          const isImg = a.type.startsWith('image/')
          return (
            <a key={a.path} href={a.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
                background: 'var(--fill-secondary)', textDecoration: 'none', color: 'var(--label-primary)',
                border: '1px solid var(--separator)', fontSize: 13 }}>
              {isImg
                ? <img src={a.url} alt={a.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} />
                : <Icon size={18} style={{ color: 'var(--blue)' }} />}
              <div>
                <div style={{ fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--label-tertiary)' }}>{fmt(a.size)}</div>
              </div>
              <ExternalLink size={13} style={{ color: 'var(--label-tertiary)', marginLeft: 4 }} />
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--separator)'}`,
          borderRadius: 12, padding: '20px 16px', cursor: 'pointer', textAlign: 'center',
          background: dragging ? 'rgba(var(--blue-rgb,0,122,255),.07)' : 'var(--fill-quaternary)',
          transition: 'all .15s ease', marginBottom: assets.length || isUploading ? 12 : 0,
        }}>
        <Upload size={22} style={{ color: 'var(--blue)', marginBottom: 8 }} />
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--label-primary)' }}>
          {dragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--label-tertiary)', marginTop: 4 }}>
          Images · PDFs · Videos · up to 50 MB each
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*,application/pdf,video/mp4,video/quicktime,video/webm"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files) uploadBatch(Array.from(e.target.files)); e.target.value = '' }} />
      </div>

      {/* Uploading indicators */}
      {isUploading && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.keys(uploading).map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--label-secondary)',
              background: 'var(--fill-secondary)', padding: '6px 10px', borderRadius: 8 }}>
              <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Uploading…
            </div>
          ))}
        </div>
      )}

      {/* Uploaded file list */}
      {assets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {assets.map((a) => {
            const Icon = fileIcon(a.type)
            const isImg = a.type.startsWith('image/')
            return (
              <div key={a.path} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10, background: 'var(--fill-secondary)',
                border: '1px solid var(--separator)', maxWidth: 240 }}>
                {isImg
                  ? <img src={a.url} alt={a.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--fill-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} style={{ color: 'var(--blue)' }} />
                    </div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--label-tertiary)' }}>{fmt(a.size)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(a) }}
                  style={{ marginLeft: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 2,
                    color: 'var(--label-tertiary)', display: 'flex', flexShrink: 0, borderRadius: 4 }}>
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{error}</div>}

      {/* Spinner keyframe (inline to avoid index.css edit) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
