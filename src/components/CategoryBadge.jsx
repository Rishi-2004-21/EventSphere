const CATEGORY_CONFIG = {
  Art: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', emoji: '🎨' },
  Tech: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', emoji: '💻' },
  Fitness: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '🏃' },
  Cultural: { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', emoji: '🎭' },
  Community: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', emoji: '🤝' },
  Lifestyle: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', emoji: '✨' },
};

export default function CategoryBadge({ category, size = 'sm' }) {
  const cfg = CATEGORY_CONFIG[category] || { color: '#64748b', bg: 'rgba(100,116,139,0.15)', emoji: '📌' };
  return (
    <span
      className={`category-badge cat-${size}`}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + '40' }}
    >
      {cfg.emoji} {category}
    </span>
  );
}
