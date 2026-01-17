import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/dashboard/StatCard';
import ProgressRing from '@/components/dashboard/ProgressRing';
import PerformanceBadge from '@/components/dashboard/PerformanceBadge';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { 
  getEmployeePerformances, 
  getEmployeeTarget, 
  getWeeklyStats,
  getPerformanceLevel,
  addPerformance,
  updatePerformance,
  deletePerformance,
  getCurrentMonth,
  DailyPerformance,
  checkIn,
  checkOut,
  getTodayAttendance,
  getEmployeeAttendance,
  getAttendanceStats,
  addLeaveRequest,
  getEmployeeLeaveRequests,
  LeaveRequest,
  Attendance,
  addNotification,
} from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Sparkles, 
  Trash2,
  DollarSign,
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dailyEntry, setDailyEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    callsMade: '',
    leadsContacted: '',
    leadsConverted: '',
    revenueGenerated: '',
    revenuePending: '',
  });
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'casual' as 'sick' | 'casual' | 'annual' | 'emergency' | 'half-day',
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<DailyPerformance | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Force refresh data when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('localStorage-update' as any, handleStorageChange);
    return () => window.removeEventListener('localStorage-update' as any, handleStorageChange);
  }, []);

  if (!user) return null;

  const performances = getEmployeePerformances(user.id);
  const currentMonth = getCurrentMonth();
  const target = getEmployeeTarget(user.id, currentMonth);
  const weeklyStats = getWeeklyStats(user.id);
  const performanceLevel = getPerformanceLevel(weeklyStats.conversionRate);
  const todayAttendance = getTodayAttendance(user.id);
  const attendanceStats = getAttendanceStats(user.id, currentMonth);
  const leaveRequests = getEmployeeLeaveRequests(user.id);
  
  const targetProgress = target 
    ? Math.round((target.achievedValue / target.targetValue) * 100)
    : 0;
  
  const revenueProgress = target && target.revenueTarget > 0
    ? Math.round((target.revenueAchieved / target.revenueTarget) * 100)
    : 0;

  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const callsMade = parseInt(dailyEntry.callsMade) || 0;
    const leadsContacted = parseInt(dailyEntry.leadsContacted) || 0;
    const leadsConverted = parseInt(dailyEntry.leadsConverted) || 0;
    const revenueGenerated = parseFloat(dailyEntry.revenueGenerated) || 0;
    const revenuePending = parseFloat(dailyEntry.revenuePending) || 0;

    if (callsMade === 0 && leadsContacted === 0 && leadsConverted === 0 && revenueGenerated === 0) {
      toast.error('Please enter at least one value');
      return;
    }

    if (leadsConverted > leadsContacted) {
      toast.error('Conversions cannot be more than leads contacted');
      return;
    }

    addPerformance({
      employeeId: user.id,
      date: dailyEntry.date,
      callsMade,
      leadsContacted,
      leadsConverted,
      revenueGenerated,
      revenuePending,
    });

    toast.success('Daily activity logged successfully!', {
      description: `${callsMade} calls, ${leadsConverted} conversions, ₹${revenueGenerated.toLocaleString()} revenue recorded.`,
    });
    
    setDailyEntry({ 
      date: new Date().toISOString().split('T')[0],
      callsMade: '', 
      leadsContacted: '', 
      leadsConverted: '',
      revenueGenerated: '',
      revenuePending: '',
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleCheckIn = () => {
    checkIn(user.id);
    addNotification({
      type: 'login',
      employeeId: user.id,
      employeeName: user.name,
      message: `${user.name} checked in at ${new Date().toLocaleTimeString()}`,
    });
    toast.success('Checked in successfully!', {
      description: `You checked in at ${new Date().toLocaleTimeString()}`,
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleCheckOut = () => {
    const record = checkOut(user.id);
    if (record) {
      addNotification({
        type: 'logout',
        employeeId: user.id,
        employeeName: user.name,
        message: `${user.name} checked out after ${record.workingHours} hours`,
      });
      toast.success('Checked out successfully!', {
        description: `You worked ${record.workingHours} hours today.`,
      });
    } else {
      toast.error('Please check in first');
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    addLeaveRequest({
      employeeId: user.id,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason.trim(),
      leaveType: leaveForm.leaveType,
    });

    addNotification({
      type: 'leave_request',
      employeeId: user.id,
      employeeName: user.name,
      message: `${user.name} requested ${leaveForm.leaveType} leave from ${leaveForm.startDate} to ${leaveForm.endDate}`,
    });

    toast.success('Leave request submitted!', {
      description: 'Your request has been sent to admin for approval.',
    });
    
    setLeaveForm({ startDate: '', endDate: '', reason: '', leaveType: 'casual' });
    setShowLeaveModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePerformance = (perfId: string, date: string) => {
    deletePerformance(perfId);
    toast.success(`Entry for ${date} deleted`);
    setRefreshKey(prev => prev + 1);
  };

  const handleEditClick = (perf: DailyPerformance) => {
    setEditingPerformance(perf);
    setShowEditModal(true);
  };

  const handleUpdatePerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerformance) return;

    updatePerformance(editingPerformance.id, editingPerformance);
    toast.success('Performance updated successfully!');
    setShowEditModal(false);
    setEditingPerformance(null);
    setRefreshKey(prev => prev + 1);
  };

  const getStatusIcon = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your performance overview for this week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PerformanceBadge level={performanceLevel} size="lg" />
          {!todayAttendance?.checkIn ? (
            <Button variant="hero" onClick={handleCheckIn}>
              <LogIn className="w-4 h-4" />
              Check In
            </Button>
          ) : !todayAttendance?.checkOut ? (
            <Button variant="outline" onClick={handleCheckOut}>
              <LogOut className="w-4 h-4" />
              Check Out
            </Button>
          ) : (
            <span className="text-sm text-success font-medium">
              ✓ {todayAttendance.workingHours}h worked
            </span>
          )}
          <Button variant="hero" onClick={() => setActiveTab('daily-entry')}>
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Calls"
          value={weeklyStats.totalCalls}
          subtitle="This week"
          icon={Phone}
          variant="primary"
          className="animate-slide-up stagger-1"
        />
        <StatCard
          title="Leads Contacted"
          value={weeklyStats.totalLeadsContacted}
          subtitle="This week"
          icon={Users}
          variant="accent"
          className="animate-slide-up stagger-2"
        />
        <StatCard
          title="Conversions"
          value={weeklyStats.totalLeadsConverted}
          subtitle="This week"
          icon={TrendingUp}
          variant="success"
          className="animate-slide-up stagger-3"
        />
        <StatCard
          title="Revenue"
          value={`₹${weeklyStats.totalRevenue.toLocaleString()}`}
          subtitle="Generated this week"
          icon={DollarSign}
          variant="warning"
          className="animate-slide-up stagger-4"
        />
        <StatCard
          title="Pending"
          value={`₹${weeklyStats.totalPending.toLocaleString()}`}
          subtitle="To be collected"
          icon={Clock}
          variant="primary"
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Target Progress & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Progress Card */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Monthly Targets</h3>
            <span className="text-sm text-muted-foreground">{currentMonth}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <ProgressRing progress={Math.min(targetProgress, 100)} size={120} strokeWidth={10} />
            
            <div className="mt-4 w-full space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-semibold text-foreground">{target?.achievedValue || 0}/{target?.targetValue || 0}</span>
              </div>
              
              {target && target.revenueTarget > 0 && (
                <>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold text-foreground">
                      ₹{(target?.revenueAchieved || 0).toLocaleString()}/₹{(target?.revenueTarget || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="lg:col-span-2">
          {performances.length > 0 ? (
            <PerformanceChart data={performances.slice(0, 7)} title="Weekly Performance Trend" />
          ) : (
            <div className="glass-card rounded-xl p-6 h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Log your first activity to see trends</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('daily-entry')}>
                  Log Activity
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Card */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Attendance This Month</h3>
            <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(true)}>
              <CalendarDays className="w-4 h-4" />
              Request Leave
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-2xl font-bold text-success">{attendanceStats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-2xl font-bold text-destructive">{attendanceStats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-2xl font-bold text-accent">{attendanceStats.leave}</p>
              <p className="text-xs text-muted-foreground">Leave</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-2xl font-bold text-warning">{attendanceStats.halfDay}</p>
              <p className="text-xs text-muted-foreground">Half Day</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Hours Worked</span>
              <span className="font-semibold">{attendanceStats.totalHours}h</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass-card rounded-xl p-6 border-l-4 border-l-accent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">AI Performance Insight</h3>
              <p className="text-muted-foreground">
                {performances.length === 0 ? (
                  "Start logging your daily activities to get personalized insights and recommendations."
                ) : (
                  <>
                    Your conversion rate of <span className="text-accent font-medium">{weeklyStats.conversionRate}%</span> is 
                    {weeklyStats.conversionRate >= 25 ? ' above' : ' below'} the typical target of 25%. 
                    {weeklyStats.conversionRate >= 25 
                      ? " Great job! Keep maintaining this momentum to hit your monthly target."
                      : " Focus on qualifying leads better before calls to improve your conversion rate."}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDailyEntry = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log Daily Activity</h1>
        <p className="text-muted-foreground mt-1">
          Record your sales activities and revenue
        </p>
      </div>

      <div className="glass-card rounded-xl p-8">
        <form onSubmit={handleDailySubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={dailyEntry.date}
              onChange={(e) => setDailyEntry({ ...dailyEntry, date: e.target.value })}
              className="h-12"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calls" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Calls Made
              </Label>
              <Input
                id="calls"
                type="number"
                min="0"
                placeholder="0"
                value={dailyEntry.callsMade}
                onChange={(e) => setDailyEntry({ ...dailyEntry, callsMade: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leads" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Leads Contacted
              </Label>
              <Input
                id="leads"
                type="number"
                min="0"
                placeholder="0"
                value={dailyEntry.leadsContacted}
                onChange={(e) => setDailyEntry({ ...dailyEntry, leadsContacted: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversions" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Leads Converted
              </Label>
              <Input
                id="conversions"
                type="number"
                min="0"
                placeholder="0"
                value={dailyEntry.leadsConverted}
                onChange={(e) => setDailyEntry({ ...dailyEntry, leadsConverted: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                Revenue Generated (₹)
              </Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={dailyEntry.revenueGenerated}
                onChange={(e) => setDailyEntry({ ...dailyEntry, revenueGenerated: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                Revenue Pending (₹)
              </Label>
              <Input
                id="pending"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={dailyEntry.revenuePending}
                onChange={(e) => setDailyEntry({ ...dailyEntry, revenuePending: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full">
            Submit Daily Activity
          </Button>
        </form>
      </div>
    </div>
  );

  const renderMyTargets = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Targets</h1>
        <p className="text-muted-foreground mt-1">Track your monthly goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Target */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Conversion Target - {currentMonth}</h3>
          <div className="flex items-center justify-center py-6">
            <ProgressRing progress={Math.min(targetProgress, 100)} size={180} strokeWidth={12} />
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target</span>
              <span className="font-semibold">{target?.targetValue || 0} conversions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Achieved</span>
              <span className="font-semibold text-success">{target?.achievedValue || 0} conversions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-accent">
                {Math.max((target?.targetValue || 0) - (target?.achievedValue || 0), 0)} conversions
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Target */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Target - {currentMonth}</h3>
          <div className="flex items-center justify-center py-6">
            <ProgressRing progress={Math.min(revenueProgress, 100)} size={180} strokeWidth={12} />
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target</span>
              <span className="font-semibold">₹{(target?.revenueTarget || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Achieved</span>
              <span className="font-semibold text-success">₹{(target?.revenueAchieved || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-accent">
                ₹{Math.max((target?.revenueTarget || 0) - (target?.revenueAchieved || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projected Outcome */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Projected Outcome</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performances.length > 0 ? (
            <>
              <div className={`p-4 rounded-lg ${
                targetProgress >= 80 ? 'bg-success/10 border border-success/20' : 
                targetProgress >= 50 ? 'bg-warning/10 border border-warning/20' :
                'bg-destructive/10 border border-destructive/20'
              }`}>
                <p className={`text-sm font-medium ${
                  targetProgress >= 80 ? 'text-success' : 
                  targetProgress >= 50 ? 'text-warning' : 'text-destructive'
                }`}>
                  {targetProgress >= 80 ? 'On Track 🎯' : 
                   targetProgress >= 50 ? 'Needs Effort ⚠️' : 'Behind Target ❌'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {targetProgress}% Conversions
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                revenueProgress >= 80 ? 'bg-success/10 border border-success/20' : 
                revenueProgress >= 50 ? 'bg-warning/10 border border-warning/20' :
                'bg-destructive/10 border border-destructive/20'
              }`}>
                <p className={`text-sm font-medium ${
                  revenueProgress >= 80 ? 'text-success' : 
                  revenueProgress >= 50 ? 'text-warning' : 'text-destructive'
                }`}>
                  Revenue Progress
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {revenueProgress}% Achieved
                </p>
              </div>
            </>
          ) : (
            <div className="col-span-2 p-4 rounded-lg bg-muted text-center">
              <p className="text-muted-foreground">Log activities to see projections</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => {
    const monthlyAttendance = getEmployeeAttendance(user.id, currentMonth);
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-1">Track your attendance and request leave</p>
          </div>
          <Button variant="hero" onClick={() => setShowLeaveModal(true)}>
            <CalendarDays className="w-4 h-4" />
            Request Leave
          </Button>
        </div>

        {/* Today's Status */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Today's Status</h3>
          <div className="flex items-center gap-4">
            {!todayAttendance?.checkIn ? (
              <>
                <div className="p-4 rounded-lg bg-muted flex-1 text-center">
                  <p className="text-muted-foreground">Not checked in yet</p>
                </div>
                <Button variant="hero" onClick={handleCheckIn}>
                  <LogIn className="w-4 h-4" />
                  Check In Now
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex-1">
                  <p className="text-sm text-muted-foreground">Check In</p>
                  <p className="text-xl font-bold text-success">{todayAttendance.checkIn}</p>
                </div>
                {todayAttendance.checkOut ? (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex-1">
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="text-xl font-bold text-accent">{todayAttendance.checkOut}</p>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handleCheckOut}>
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </Button>
                )}
                {todayAttendance.workingHours && (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex-1">
                    <p className="text-sm text-muted-foreground">Hours Worked</p>
                    <p className="text-xl font-bold text-warning">{todayAttendance.workingHours}h</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-foreground">{attendanceStats.present}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-3xl font-bold text-foreground">{attendanceStats.absent}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-3xl font-bold text-foreground">{attendanceStats.leave}</p>
            <p className="text-sm text-muted-foreground">On Leave</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-3xl font-bold text-foreground">{attendanceStats.totalHours}h</p>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </div>
        </div>

        {/* Attendance History */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Attendance History</h3>
          </div>
          {monthlyAttendance.length > 0 ? (
            <div className="divide-y divide-border">
              {monthlyAttendance.map((record) => (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.checkIn && `In: ${record.checkIn}`}
                      {record.checkOut && ` · Out: ${record.checkOut}`}
                      {record.workingHours && ` · ${record.workingHours}h`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-success/10 text-success' :
                    record.status === 'leave' ? 'bg-accent/10 text-accent' :
                    record.status === 'half-day' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No attendance records for this month
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">My Leave Requests</h3>
          </div>
          {leaveRequests.length > 0 ? (
            <div className="divide-y divide-border">
              {leaveRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium text-foreground">
                        {request.startDate} to {request.endDate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave · {request.reason}
                      </p>
                      {request.reviewNote && (
                        <p className="text-sm text-accent mt-1">Admin: {request.reviewNote}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'approved' ? 'bg-success/10 text-success' :
                    request.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No leave requests
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPerformance = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance History</h1>
        <p className="text-muted-foreground mt-1">View and update your detailed performance metrics</p>
      </div>

      {performances.length > 0 ? (
        <>
          <PerformanceChart data={performances.slice(0, 14)} title="Activity Overview (Last 14 Days)" />

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Activity Log</h3>
            </div>
            <div className="divide-y divide-border">
              {performances.map((perf) => (
                <div key={perf.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(perf.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {perf.callsMade} calls · {perf.leadsContacted} leads · {perf.leadsConverted} conversions
                    </p>
                    <p className="text-sm text-success">
                      ₹{perf.revenueGenerated.toLocaleString()} generated
                      {perf.revenuePending > 0 && (
                        <span className="text-warning ml-2">· ₹{perf.revenuePending.toLocaleString()} pending</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PerformanceBadge 
                      level={getPerformanceLevel(
                        perf.leadsContacted > 0 
                          ? Math.round((perf.leadsConverted / perf.leadsContacted) * 100)
                          : 0
                      )} 
                      size="sm" 
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditClick(perf)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePerformance(perf.id, perf.date)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No activity logged yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your daily performance</p>
          <Button variant="hero" onClick={() => setActiveTab('daily-entry')}>
            <Plus className="w-4 h-4" />
            Log First Activity
          </Button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'daily-entry': return renderDailyEntry();
      case 'my-targets': return renderMyTargets();
      case 'attendance': return renderAttendance();
      case 'performance': return renderPerformance();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ml-64 p-8 pb-16">
        {renderContent()}
        
        {/* Footer Branding */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Developed by <span className="font-semibold text-accent">Akash Creation</span>
          </p>
        </footer>
      </main>

      {/* Leave Request Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent" />
              Request Leave
            </DialogTitle>
            <DialogDescription>
              Submit a leave request for admin approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-type">Leave Type</Label>
              <Select
                value={leaveForm.leaveType}
                onValueChange={(value: 'sick' | 'casual' | 'annual' | 'emergency' | 'half-day') => 
                  setLeaveForm({ ...leaveForm, leaveType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                  <SelectItem value="half-day">Half Day Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Briefly explain the reason for your leave..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Performance Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-accent" />
              Edit Performance Entry
            </DialogTitle>
            <DialogDescription>
              Update the performance data. Use this to convert pending revenue to generated.
            </DialogDescription>
          </DialogHeader>

          {editingPerformance && (
            <form onSubmit={handleUpdatePerformance} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Calls Made</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingPerformance.callsMade}
                    onChange={(e) => setEditingPerformance({ 
                      ...editingPerformance, 
                      callsMade: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Leads Contacted</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingPerformance.leadsContacted}
                    onChange={(e) => setEditingPerformance({ 
                      ...editingPerformance, 
                      leadsContacted: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conversions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingPerformance.leadsConverted}
                    onChange={(e) => setEditingPerformance({ 
                      ...editingPerformance, 
                      leadsConverted: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    Revenue Generated (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPerformance.revenueGenerated}
                    onChange={(e) => setEditingPerformance({ 
                      ...editingPerformance, 
                      revenueGenerated: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    Revenue Pending (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPerformance.revenuePending}
                    onChange={(e) => setEditingPerformance({ 
                      ...editingPerformance, 
                      revenuePending: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent">
                  💡 Tip: When pending revenue is collected, reduce the pending amount and add it to generated revenue.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;
