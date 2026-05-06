
export default function StatusBadge({ status }) {
  const statusLower = status?.toLowerCase() || '';
  
  let colorClass = "bg-muted text-muted-foreground border-border";
  
  if (statusLower === 'completed' || statusLower === 'active' || statusLower === 'good') {
      colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  } else if (statusLower === 'pending' || statusLower === 'in_progress' || statusLower === 'warning') {
      colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
  } else if (statusLower === 'partial') {
      colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
  } else if (statusLower === 'cancelled' || statusLower === 'failed' || statusLower === 'critical') {
      colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20";
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${colorClass}`}>
      {status}
    </span>
  );
}
