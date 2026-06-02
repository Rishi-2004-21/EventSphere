import { Sparkles } from 'lucide-react';

export default function AIInsightsPanel({ insights, isLoading, onFetch }) {
  return (
    <div className="ai-insights-panel">
      <div className="ai-panel-header">
        <div className="ai-badge">
          <Sparkles size={14} />
          AI Powered
        </div>
        <h3 className="ai-panel-title">AI Performance Insights</h3>
        <p className="ai-panel-sub">
          Get personalized recommendations powered by Claude AI.
        </p>
      </div>

      {!insights && !isLoading && (
        <button className="btn-ai" onClick={onFetch} id="get-ai-insights-btn">
          <Sparkles size={16} />
          Get AI Insights
        </button>
      )}

      {isLoading && (
        <div className="ai-loading">
          <div className="ai-loading-dots">
            <span /><span /><span />
          </div>
          <p>Analyzing your events…</p>
        </div>
      )}

      {insights && !isLoading && (
        <div className="ai-insights-content">
          <div className="ai-insights-badge">
            <Sparkles size={12} /> AI Generated
          </div>
          {insights.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className="ai-insight-line">
              {line.startsWith('**') ? (
                <strong>{line.replace(/\*\*/g, '')}</strong>
              ) : (
                line
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
