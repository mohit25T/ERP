import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KPICard({ title, value, trend, isPositive, icon: Icon, description }) {
  const trendColor = isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-card rounded shadow-sm border border-border p-4 transition-colors flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className="p-1.5 bg-primary/10 border border-primary/20 rounded text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-auto">
        <span className="text-2xl font-black text-foreground tracking-tighter">{value}</span>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trendColor} uppercase tracking-tighter`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trend}</span>
          </div>
          {description && (
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
