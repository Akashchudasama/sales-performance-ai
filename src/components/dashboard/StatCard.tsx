import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'accent' | 'success' | 'warning' | 'primary';
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'accent',
  className 
}: StatCardProps) => {
  return (
    <div className={cn(
      "stat-card border border-border/50",
      `stat-card-${variant}`,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === 'accent' && "bg-accent/10",
          variant === 'success' && "bg-success/10",
          variant === 'warning' && "bg-warning/10",
          variant === 'primary' && "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'accent' && "text-accent",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'primary' && "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
