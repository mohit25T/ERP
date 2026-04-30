import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KPICard({ title, value, trend, isPositive, icon: Icon, description }) {
  const trendColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="p-2.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-indigo-600 shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mt-auto">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trend}</span>
            </div>
            {description && (
                <span className="text-xs text-slate-400 font-medium">{description}</span>
            )}
        </div>
      </div>
    </div>
  );
}
