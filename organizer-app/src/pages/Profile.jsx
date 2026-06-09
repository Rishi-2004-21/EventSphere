import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { User, Save, Wallet, UploadCloud, X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { nanoid } from 'nanoid'

export default function Profile() {
  const { currentUser, updateUser } = useAuth()
  
  const [upiId, setUpiId] = useState(currentUser?.upi_id || '')
  const [upiQrUrl, setUpiQrUrl] = useState(currentUser?.upi_qr_url || '')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef(null)

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `upi-codes/${currentUser.id}/upi-qr.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath)

      setUpiQrUrl(publicUrl)
      toast.success('QR Code uploaded successfully')
    } catch (err) {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSavePaymentSettings() {
    if (!upiId.trim() && !upiQrUrl) {
      toast.error('Please add either a UPI ID or upload a QR Code')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          upi_id: upiId.trim(),
          upi_qr_url: upiQrUrl
        })
        .eq('id', currentUser.id)

      if (error) throw error

      updateUser({
        upi_id: upiId.trim(),
        upi_qr_url: upiQrUrl
      })

      toast.success('Payment settings saved successfully')
    } catch (err) {
      toast.error('Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrapper">
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Organizer Profile</h1>

      {/* Basic Info */}
      <div className="profile-header" style={{ marginBottom: '2rem' }}>
        <div className="profile-avatar">
          <User size={24} />
        </div>
        <div>
          <div className="profile-name">{currentUser?.name}</div>
          <div className="profile-meta">{currentUser?.email}</div>
        </div>
      </div>

      {/* Payment Settings Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={18} style={{ color: 'var(--teal)' }} /> Payment Settings
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Add your UPI details so attendees can pay you directly for your events.
        </p>

        {(!currentUser?.upi_id || !currentUser?.upi_qr_url) && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem',
            color: '#f59e0b', fontSize: '0.85rem'
          }}>
            ⚠ <strong>Please add your UPI ID and QR code</strong> so attendees can pay for your events. Without these, you cannot receive payments.
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Your UPI ID
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Attendees will pay to this UPI ID when booking your events.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Your UPI QR Code
          </label>
          
          <div 
            style={{
              border: '2px dashed var(--border)', borderRadius: '12px',
              padding: '2rem', textAlign: 'center', background: 'var(--bg)',
              position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
              borderColor: uploading ? 'var(--teal)' : 'var(--border)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', borderTopColor: 'var(--teal)' }}></div>
                <div style={{ color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 500 }}>Uploading...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'var(--bg-card-2)', padding: '1rem', borderRadius: '50%', color: 'var(--text-muted)' }}>
                  <Camera size={24} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Upload your UPI QR code image
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Click to browse (JPG, PNG)
                </div>
              </div>
            )}
          </div>

          {upiQrUrl && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Preview:</div>
              <div style={{ 
                background: '#fff', padding: '0.5rem', borderRadius: '12px', 
                display: 'inline-block', border: '1px solid var(--border)' 
              }}>
                <img 
                  src={upiQrUrl} 
                  alt="UPI QR Code" 
                  style={{ width: '150px', height: '150px', objectFit: 'contain', display: 'block' }} 
                />
              </div>
              <button
                className="btn-ghost"
                onClick={() => setUpiQrUrl('')}
                style={{ display: 'block', marginTop: '0.5rem', color: '#ef4444', fontSize: '0.8rem', padding: '0.2rem 0' }}
              >
                Remove QR Code
              </button>
            </div>
          )}
        </div>

        <button
          className="btn-teal"
          onClick={handleSavePaymentSettings}
          disabled={saving || uploading}
          style={{ width: '100%', gap: '0.5rem' }}
        >
          {saving ? <span className="btn-spinner" /> : <Save size={16} />}
          Save Payment Settings
        </button>
      </div>

    </div>
  )
}
