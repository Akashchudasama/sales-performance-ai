import { Employee } from '@/lib/dataService';
import { cn } from '@/lib/utils';
import PerformanceBadge from './PerformanceBadge';
import ProgressRing from './ProgressRing';
import { Phone, Users, Target } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  stats: {
    totalCalls: number;
    totalLeadsConverted: number;
    conversionRate: number;
    target?: {
      targetValue: number;
      achievedValue: number;
    } | null;
  };
  className?: string;
}

const EmployeeCard = ({ employee, stats, className }: EmployeeCardProps) => {
  const getPerformanceLevel = (rate: number): 'excellent' | 'average' | 'poor' => {
    if (rate >= 30) return 'excellent';
    if (rate >= 20) return 'average';
    return 'poor';
  };

  const targetProgress = stats.target 
    ? Math.round((stats.target.achievedValue / stats.target.targetValue) * 100)
    : 0;

  return (
    <div className={cn(
      "glass-card rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      className
    )}>
      <div className="flex items-start gap-4">
        <img 
          src={employee.avatar} 
          alt={employee.name}
          className="w-14 h-14 rounded-full ring-2 ring-accent/20"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
            </div>
            <PerformanceBadge level={getPerformanceLevel(stats.conversionRate)} size="sm" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-lg bg-accent/10 flex items-center justify-center mb-2">
            <Phone className="w-5 h-5 text-accent" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.totalCalls}</p>
          <p className="text-xs text-muted-foreground">Calls</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-success" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.totalLeadsConverted}</p>
          <p className="text-xs text-muted-foreground">Conversions</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Rate</p>
        </div>
      </div>

      {stats.target && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Monthly Target</span>
            <span className="text-sm font-medium">
              {stats.target.achievedValue} / {stats.target.targetValue}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                targetProgress >= 80 ? "bg-success" :
                targetProgress >= 50 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;
