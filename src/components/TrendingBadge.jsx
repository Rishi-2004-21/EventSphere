const TRENDING_CONFIG = {
  Hot: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔥', label: '🔥 Hot' },
  Rising: { color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: '📈', label: '📈 Rising' },
  Steady: { color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: '📊', label: '📊 Steady' },
};

export default function TrendingBadge({ trending }) {
  if (!trending || trending === 'Steady') return null;
  const cfg = TRENDING_CONFIG[trending] || TRENDING_CONFIG.Steady;
  return (
    <span
      className="trending-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + '40' }}
    >
      {cfg.label}
    </span>
  );
}
