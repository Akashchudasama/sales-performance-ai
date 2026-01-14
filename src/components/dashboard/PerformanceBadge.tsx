import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceBadgeProps {
  level: 'excellent' | 'average' | 'poor';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PerformanceBadge = ({ 
  level, 
  showIcon = true, 
  size = 'md',
  className 
}: PerformanceBadgeProps) => {
  const config = {
    excellent: {
      label: 'Excellent',
      icon: TrendingUp,
      classes: 'performance-excellent',
    },
    average: {
      label: 'Average',
      icon: Minus,
      classes: 'performance-average',
    },
    poor: {
      label: 'Needs Improvement',
      icon: TrendingDown,
      classes: 'performance-poor',
    },
  };

  const { label, icon: Icon, classes } = config[level];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium border",
      classes,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
};

export default PerformanceBadge;
