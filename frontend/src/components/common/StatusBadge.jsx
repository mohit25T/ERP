
export default function StatusBadge({ status }) {
  const statusLower = status?.toLowerCase() || '';
  
  let bgClass = "bg-slate-50 text-slate-600 border-slate-200";
  
  if (statusLower === 'completed' || statusLower === 'active' || statusLower === 'good') {
      bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (statusLower === 'pending' || statusLower === 'in_progress' || statusLower === 'warning') {
      bgClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (statusLower === 'partial') {
      bgClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (statusLower === 'cancelled' || statusLower === 'failed' || statusLower === 'critical') {
      bgClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${bgClass}`}>
      {status}
    </span>
  );
}
