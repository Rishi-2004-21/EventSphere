import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export default function WalletCard({ balance, totalEarned, totalEvents }) {
  return (
    <div className="wallet-card">
      <div className="wallet-card-bg" />
      <div className="wallet-card-content">
        <div className="wallet-header">
          <div className="wallet-icon-wrap">
            <Wallet size={22} />
          </div>
          <div className="wallet-label">Wallet Balance</div>
        </div>
        <div className="wallet-balance">{formatCurrency(balance || 0)}</div>
        <div className="wallet-stats">
          <div className="wallet-stat">
            <TrendingUp size={14} />
            <span>Lifetime: {formatCurrency(totalEarned || 0)}</span>
          </div>
          <div className="wallet-stat">
            <ArrowUpRight size={14} />
            <span>{totalEvents || 0} Events</span>
          </div>
        </div>
        <p className="wallet-note">
          90% of every ticket goes directly to your wallet instantly.
        </p>
      </div>
    </div>
  );
}
