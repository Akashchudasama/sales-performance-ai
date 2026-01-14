import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyPerformance } from '@/lib/dataService';

interface PerformanceChartProps {
  data: DailyPerformance[];
  title?: string;
}

const PerformanceChart = ({ data, title }: PerformanceChartProps) => {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calls: d.callsMade,
    leads: d.leadsContacted,
    conversions: d.leadsConverted,
  })).reverse();

  return (
    <div className="glass-card rounded-xl p-6">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 47%, 20%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(222, 47%, 20%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(214, 32%, 91%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(222, 47%, 11%)', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="calls" 
              stroke="hsl(222, 47%, 20%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCalls)" 
              name="Calls Made"
            />
            <Area 
              type="monotone" 
              dataKey="conversions" 
              stroke="hsl(173, 58%, 39%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorConversions)" 
              name="Conversions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Calls Made</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Conversions</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
