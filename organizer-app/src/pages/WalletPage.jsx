import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Wallet, Calendar } from 'lucide-react'
import { formatCurrency } from '../utils/formatCurrency'

export default function WalletPage() {
  const { currentUser, updateUser } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [walletBalance, setWalletBalance] = useState(currentUser?.wallet_balance || 0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Get organizer's events
      const { data: orgEvents } = await supabase.from('events').select('id, title').eq('organizer_id', currentUser.id)
      const eventIds = orgEvents?.map((e) => e.id) || []
      const eventMap = {}
      orgEvents?.forEach((e) => { eventMap[e.id] = e.title })

      if (eventIds.length > 0) {
        const { data: bkgs } = await supabase.from('bookings')
          .select('id, event_id, booked_at, amount_paid, platform_fee, organizer_received')
          .in('event_id', eventIds)
          .order('booked_at', { ascending: false })

        if (bkgs) {
          setTransactions(bkgs.map((b) => ({ ...b, eventTitle: eventMap[b.event_id] || 'Unknown Event' })))
        }
      }

      // Get fresh wallet balance
      const { data: user } = await supabase.from('users').select('wallet_balance').eq('id', currentUser.id).single()
      if (user) {
        setWalletBalance(user.wallet_balance || 0)
        updateUser({ wallet_balance: user.wallet_balance || 0 })
      }

      setLoading(false)
    }
    fetchData()
  }, [currentUser.id])

  const lifetimeRevenue = transactions.reduce((s, t) => s + (Number(t.organizer_received) || 0), 0)
  const lifetimeFees = transactions.reduce((s, t) => s + (Number(t.platform_fee) || 0), 0)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={24} style={{ color: 'var(--teal)' }} /> My Wallet
        </h1>
      </div>

      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="wallet-label">Current Wallet Balance</div>
        <div className="wallet-amount">{formatCurrency(walletBalance)}</div>
        <div className="wallet-note">Updated instantly after every booking • 90% of each ticket price</div>
      </div>

      {/* Transaction Table */}
      <div className="table-wrap">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700 }}>Transaction History</span>
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '2rem' }}><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-icon">💸</div>
            <div className="empty-sub">No transactions yet. Transactions appear after ticket sales.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Booking Date</th>
                <th>Ticket Price</th>
                <th>Platform Fee Deducted</th>
                <th>Amount Credited</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600 }}>{tx.eventTitle}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={12} /> {formatDate(tx.booked_at)}
                    </div>
                  </td>
                  <td>{formatCurrency(tx.amount_paid)}</td>
                  <td className="tx-debit">- {formatCurrency(tx.platform_fee)}</td>
                  <td className="tx-credit">+ {formatCurrency(tx.organizer_received)}</td>
                </tr>
              ))}
              {/* Summary row */}
              <tr className="tx-summary-row">
                <td colSpan={2} style={{ fontWeight: 700 }}>Lifetime Totals</td>
                <td />
                <td className="tx-debit">- {formatCurrency(lifetimeFees)}</td>
                <td className="tx-credit">+ {formatCurrency(lifetimeRevenue)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
