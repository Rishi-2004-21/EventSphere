import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ShieldAlert, Check, Ban, Search, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actioningId, setActioningId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function toggleSuspension(id, currentStatus) {
    setActioningId(id)
    const { error } = await supabase.from('users').update({ is_suspended: !currentStatus }).eq('id', id)
    if (error) {
      toast.error('Failed to update user status')
    } else {
      toast.success(currentStatus ? 'User restored' : 'User suspended')
      fetchUsers()
    }
    setActioningId(null)
  }

  async function verifyOrganizer(id) {
    setActioningId(id)
    const { error } = await supabase.from('users').update({ is_verified: true }).eq('id', id)
    if (error) {
      toast.error('Verification failed')
    } else {
      toast.success('Organizer verified')
      fetchUsers()
    }
    setActioningId(null)
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'organizer' && u.role !== 'organizer') return false
    if (filter === 'attendee' && u.role !== 'attendee') return false
    if (filter === 'suspended' && !u.is_suspended) return false
    if (filter === 'unverified' && (u.role !== 'organizer' || u.is_verified)) return false
    
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage attendees, verify organizers, and handle suspensions</p>
      </div>

      <div className="table-wrap">
        <div className="filters-row">
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Users</option>
            <option value="organizer">Organizers Only</option>
            <option value="attendee">Attendees Only</option>
            <option value="unverified">Unverified Organizers</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="filter-search" placeholder="Search by name or email..." 
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2rem', width: '100%' }} />
          </div>
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No users found</div>
            <div className="empty-sub">Adjust your filters to see results</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-bold">{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td><span className={`badge role-${u.role}`}>{u.role.toUpperCase()}</span></td>
                    <td>
                      {u.role === 'organizer' ? (
                        u.is_verified ? <span className="text-green flex items-center gap-sm" style={{ fontSize: '0.8rem', fontWeight: 600 }}><ShieldCheck size={14}/> Verified</span>
                                      : <span className="text-amber flex items-center gap-sm" style={{ fontSize: '0.8rem', fontWeight: 600 }}><ShieldAlert size={14}/> Pending</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {u.is_suspended 
                        ? <span className="badge badge-red">Suspended</span> 
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td>
                      <div className="action-group">
                        {u.role === 'organizer' && !u.is_verified && !u.is_suspended && (
                          <button className="btn-approve" onClick={() => verifyOrganizer(u.id)} disabled={actioningId === u.id}>
                            <Check size={14}/> Verify
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          u.is_suspended ? (
                            <button className="btn-restore" onClick={() => toggleSuspension(u.id, true)} disabled={actioningId === u.id}>
                              <Check size={14}/> Restore
                            </button>
                          ) : (
                            <button className="btn-suspend" onClick={() => toggleSuspension(u.id, false)} disabled={actioningId === u.id}>
                              <Ban size={14}/> Suspend
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
