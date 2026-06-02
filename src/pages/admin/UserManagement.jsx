import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import { CheckCircle, ShieldOff, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const { state, dispatch } = useApp();

  const handleVerify = (userId) => {
    dispatch({ type: 'VERIFY_ORGANIZER', payload: { userId } });
    toast.success('Organizer verified!');
  };

  const handleSuspend = (userId, suspended) => {
    dispatch({ type: 'SUSPEND_USER', payload: { userId, suspended } });
    toast.success(suspended ? 'User suspended' : 'User reinstated');
  };

  const roleColor = { admin: '#ef4444', organizer: '#6366f1', attendee: '#10b981' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-sub">{state.usersStore.length} total users</p>
      </div>

      <div className="events-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.usersStore.map((user) => (
              <tr key={user.id} className={user.suspended ? 'row-suspended' : ''}>
                <td>
                  <div className="user-cell">
                    <img src={user.avatar} alt={user.name} className="table-avatar" />
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className="text-muted">{user.email}</td>
                <td>
                  <span
                    className="role-badge"
                    style={{ color: roleColor[user.role], background: roleColor[user.role] + '20' }}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  {user.suspended ? (
                    <span className="status-badge status-rejected">Suspended</span>
                  ) : user.role === 'organizer' ? (
                    user.isVerified ? (
                      <span className="status-badge status-approved">
                        <UserCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span className="status-badge status-pending">Unverified</span>
                    )
                  ) : (
                    <span className="status-badge status-approved">Active</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {user.role === 'organizer' && !user.isVerified && !user.suspended && (
                      <button
                        id={`verify-${user.id}`}
                        className="btn-success-sm"
                        onClick={() => handleVerify(user.id)}
                      >
                        <CheckCircle size={14} /> Verify
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        id={`suspend-${user.id}`}
                        className={user.suspended ? 'btn-success-sm' : 'btn-danger-sm'}
                        onClick={() => handleSuspend(user.id, !user.suspended)}
                      >
                        <ShieldOff size={14} />
                        {user.suspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
