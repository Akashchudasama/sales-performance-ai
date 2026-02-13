import { useScreenActivity, formatMinutes, getEmployeeActivitySessions } from '@/hooks/useScreenActivity';
import { Button } from '@/components/ui/button';
import { Monitor, Play, Square, Coffee, Zap, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenActivityPanelProps {
  employeeId: string;
  employeeName?: string;
  showControls?: boolean;
}

const ScreenActivityPanel = ({ employeeId, employeeName, showControls = true }: ScreenActivityPanelProps) => {
  const { isTracking, isIdle, session, startTracking, stopTracking } = useScreenActivity(employeeId);

  const recentSessions = getEmployeeActivitySessions(employeeId).slice(0, 7);

  const productivityPercent = session && session.totalSessionMinutes > 0
    ? Math.round((session.productiveMinutes / session.totalSessionMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="w-6 h-6 text-accent" />
            Screen Activity Tracker
          </h2>
          <p className="text-muted-foreground mt-1">
            {employeeName ? `${employeeName}'s activity` : 'Monitor your real-time screen activity'}
          </p>
        </div>
        {showControls && (
          <div className="flex gap-2">
            {!isTracking ? (
              <Button variant="hero" onClick={startTracking}>
                <Play className="w-4 h-4" />
                Start Tracking
              </Button>
            ) : (
              <Button variant="outline" onClick={stopTracking}>
                <Square className="w-4 h-4" />
                Stop Tracking
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Live Status */}
      {isTracking && (
        <div className={cn(
          "glass-card rounded-xl p-4 border-l-4 flex items-center gap-4",
          isIdle ? "border-l-warning" : "border-l-success"
        )}>
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            isIdle ? "bg-warning" : "bg-success"
          )} />
          <div>
            <p className="font-medium text-foreground">
              {isIdle ? '💤 Idle — No activity detected' : '🟢 Active — Working'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isIdle 
                ? 'Move your mouse or type to resume tracking' 
                : 'Activity is being monitored (5 min idle threshold)'}
            </p>
          </div>
        </div>
      )}

      {/* Today's Summary */}
      {session ? (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Today's Work Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
              <Clock className="w-5 h-5 mx-auto text-accent mb-2" />
              <p className="text-lg font-bold text-foreground">{session.loginTime?.slice(0, 5)}</p>
              <p className="text-xs text-muted-foreground">Login Time</p>
            </div>
            <div className="p-4 rounded-lg bg-muted border border-border text-center">
              <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-lg font-bold text-foreground">{session.logoutTime?.slice(0, 5) || '—'}</p>
              <p className="text-xs text-muted-foreground">Logout Time</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
              <Coffee className="w-5 h-5 mx-auto text-warning mb-2" />
              <p className="text-lg font-bold text-foreground">{formatMinutes(session.totalIdleMinutes)}</p>
              <p className="text-xs text-muted-foreground">Break/Idle Time</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
              <Zap className="w-5 h-5 mx-auto text-success mb-2" />
              <p className="text-lg font-bold text-foreground">{formatMinutes(session.productiveMinutes)}</p>
              <p className="text-xs text-muted-foreground">Productive Time</p>
            </div>
          </div>

          {/* Productivity Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Productivity</span>
              <span className="font-semibold text-foreground">{productivityPercent}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  productivityPercent >= 80 ? "bg-success" :
                  productivityPercent >= 50 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${productivityPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total Session: {formatMinutes(session.totalSessionMinutes)}</span>
              <span>{session.idlePeriods.length} break(s) detected</span>
            </div>
          </div>

          {/* Idle Periods Log */}
          {session.idlePeriods.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Break/Idle Log</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {session.idlePeriods.map((period, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-3 h-3 text-warning" />
                      <span className="text-muted-foreground">Break {i + 1}</span>
                    </div>
                    <span className="font-mono text-foreground">
                      {period.start.slice(0, 5)} — {period.end?.slice(0, 5) || 'ongoing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <Monitor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">No activity recorded today</p>
          <p className="text-muted-foreground mt-1">
            {showControls ? 'Click "Start Tracking" to begin monitoring your screen activity' : 'Employee hasn\'t started tracking yet'}
          </p>
        </div>
      )}

      {/* History */}
      {recentSessions.length > 1 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Login</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Logout</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Session</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Idle</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Productive</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Breaks</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.filter(s => s.logoutTime).map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{s.date}</td>
                    <td className="py-2 px-3">{s.loginTime.slice(0, 5)}</td>
                    <td className="py-2 px-3">{s.logoutTime?.slice(0, 5)}</td>
                    <td className="py-2 px-3">{formatMinutes(s.totalSessionMinutes)}</td>
                    <td className="py-2 px-3 text-warning">{formatMinutes(s.totalIdleMinutes)}</td>
                    <td className="py-2 px-3 text-success">{formatMinutes(s.productiveMinutes)}</td>
                    <td className="py-2 px-3">{s.idlePeriods.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenActivityPanel;
