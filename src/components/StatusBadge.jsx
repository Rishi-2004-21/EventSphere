const STATUS_CONFIG = {
  approved: { label: 'Approved', cls: 'status-approved' },
  pending: { label: 'Pending', cls: 'status-pending' },
  rejected: { label: 'Rejected', cls: 'status-rejected' },
  'changes-requested': { label: 'Changes Requested', cls: 'status-changes' },
  confirmed: { label: 'Confirmed', cls: 'status-approved' },
  completed: { label: 'Completed', cls: 'status-approved' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'status-pending' };
  return <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>;
}
