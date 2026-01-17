import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/dashboard/StatCard';
import EmployeeCard from '@/components/dashboard/EmployeeCard';
import TeamPieChart from '@/components/charts/TeamPieChart';
import PerformanceChart from '@/components/charts/PerformanceChart';
import AddEmployeeModal from '@/components/modals/AddEmployeeModal';
import EditEmployeeModal from '@/components/modals/EditEmployeeModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import AdminSettings from '@/pages/AdminSettings';
import { 
  getTeamStats, 
  getSalesEmployees,
  getWeeklyStats, 
  getEmployeeTarget,
  getEmployeePerformances,
  deleteEmployee,
  getCurrentMonth,
  Employee,
  getAllLeaveRequests,
  updateLeaveRequest,
  getEmployeeById,
  LeaveRequest,
  getNotifications,
  markAllNotificationsRead,
  getActiveEmployees,
  addNotification,
  getPerformances,
  getTargets,
  getAttendanceRecords,
} from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  TrendingUp, 
  Phone, 
  Target, 
  Trophy,
  Sparkles,
  Download,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  LogIn,
  LogOut,
  FileText,
  Clock,
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
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Force refresh data when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('localStorage-update' as any, handleStorageChange);
    return () => window.removeEventListener('localStorage-update' as any, handleStorageChange);
  }, []);

  if (!user) return null;

  const teamStats = getTeamStats();
  const salesEmployees = getSalesEmployees();
  const currentMonth = getCurrentMonth();
  const allLeaveRequests = getAllLeaveRequests();
  const notifications = getNotifications();
  const activeEmployees = getActiveEmployees();

  const pieChartData = teamStats.employees.map(emp => ({
    name: emp.name.split(' ')[0],
    value: emp.totalLeadsConverted,
  }));

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEmployee) {
      deleteEmployee(selectedEmployee.id);
      toast.success('Employee deleted successfully');
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleApproveLeave = (request: LeaveRequest) => {
    const employee = getEmployeeById(request.employeeId);
    updateLeaveRequest(request.id, {
      status: 'approved',
      reviewedBy: user.id,
      reviewedOn: new Date().toISOString().split('T')[0],
    });
    
    if (employee) {
      addNotification({
        type: 'leave_approved',
        employeeId: request.employeeId,
        employeeName: employee.name,
        message: `Leave request approved for ${employee.name} (${request.startDate} to ${request.endDate})`,
      });
    }
    
    toast.success('Leave request approved');
    setRefreshKey(prev => prev + 1);
  };

  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (selectedLeaveRequest) {
      const employee = getEmployeeById(selectedLeaveRequest.employeeId);
      updateLeaveRequest(selectedLeaveRequest.id, {
        status: 'rejected',
        reviewedBy: user.id,
        reviewedOn: new Date().toISOString().split('T')[0],
        reviewNote: rejectReason.trim() || 'Request rejected by admin',
      });
      
      if (employee) {
        addNotification({
          type: 'leave_rejected',
          employeeId: selectedLeaveRequest.employeeId,
          employeeName: employee.name,
          message: `Leave request rejected for ${employee.name}: ${rejectReason.trim() || 'No reason provided'}`,
        });
      }
      
      toast.success('Leave request rejected');
      setShowRejectModal(false);
      setSelectedLeaveRequest(null);
      setRejectReason('');
      setRefreshKey(prev => prev + 1);
    }
  };

  const exportData = (type: 'employees' | 'performances' | 'attendance' | 'leave') => {
    let data: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'employees':
        data = salesEmployees.map(emp => ({
          Name: emp.name,
          Email: emp.email,
          Department: emp.department,
          JoinDate: emp.joinDate,
        }));
        filename = 'employees.csv';
        break;
      case 'performances':
        data = getPerformances().map(p => {
          const emp = getEmployeeById(p.employeeId);
          return {
            Employee: emp?.name || 'Unknown',
            Date: p.date,
            Calls: p.callsMade,
            LeadsContacted: p.leadsContacted,
            Conversions: p.leadsConverted,
            RevenueGenerated: p.revenueGenerated,
            RevenuePending: p.revenuePending,
          };
        });
        filename = 'performances.csv';
        break;
      case 'attendance':
        data = getAttendanceRecords().map(a => {
          const emp = getEmployeeById(a.employeeId);
          return {
            Employee: emp?.name || 'Unknown',
            Date: a.date,
            CheckIn: a.checkIn || '-',
            CheckOut: a.checkOut || '-',
            Hours: a.workingHours || 0,
            Status: a.status,
          };
        });
        filename = 'attendance.csv';
        break;
      case 'leave':
        data = allLeaveRequests.map(l => {
          const emp = getEmployeeById(l.employeeId);
          return {
            Employee: emp?.name || 'Unknown',
            StartDate: l.startDate,
            EndDate: l.endDate,
            Type: l.leaveType,
            Reason: l.reason,
            Status: l.status,
            AppliedOn: l.appliedOn,
            ReviewNote: l.reviewNote || '-',
          };
        });
        filename = 'leave_requests.csv';
        break;
    }
    
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${type} data exported successfully`);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Team Dashboard 📊
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your sales team's performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => exportData('performances')}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="hero" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Active Employees Status */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Today's Activity
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeEmployees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No employees added yet</p>
          ) : (
            activeEmployees.map(emp => (
              <div 
                key={emp.id} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  emp.isCheckedIn && !emp.isCheckedOut 
                    ? 'bg-success/10 border border-success/20' 
                    : emp.isCheckedOut 
                    ? 'bg-muted border border-border'
                    : 'bg-destructive/10 border border-destructive/20'
                }`}
              >
                <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-medium">{emp.name.split(' ')[0]}</span>
                {emp.isCheckedIn && !emp.isCheckedOut && (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                    Working since {emp.checkInTime}
                  </Badge>
                )}
                {emp.isCheckedOut && (
                  <Badge variant="outline" className="text-xs">
                    {emp.workingHours}h worked
                  </Badge>
                )}
                {!emp.isCheckedIn && (
                  <Badge variant="outline" className="text-xs text-destructive border-destructive/20">
                    Not checked in
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Team Members"
          value={salesEmployees.length}
          subtitle="Active employees"
          icon={Users}
          variant="primary"
          className="animate-slide-up stagger-1"
        />
        <StatCard
          title="Total Calls This Week"
          value={teamStats.totalTeamCalls}
          subtitle="All team members"
          icon={Phone}
          variant="accent"
          className="animate-slide-up stagger-2"
        />
        <StatCard
          title="Total Conversions"
          value={teamStats.totalTeamConversions}
          subtitle="This week"
          icon={TrendingUp}
          variant="success"
          className="animate-slide-up stagger-3"
        />
        <StatCard
          title="Avg Conversion Rate"
          value={`${teamStats.averageConversionRate}%`}
          subtitle="Team average"
          icon={Target}
          variant="warning"
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Top Performer & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performer Card */}
        <div className="glass-card rounded-xl p-6 border-2 border-accent/20">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-semibold text-foreground">Top Performer</h3>
          </div>
          
          {teamStats.topPerformer ? (
            <div className="text-center py-4">
              <img 
                src={teamStats.topPerformer.avatar}
                alt={teamStats.topPerformer.name}
                className="w-20 h-20 rounded-full mx-auto ring-4 ring-accent/20 mb-4"
              />
              <h4 className="text-xl font-bold text-foreground">{teamStats.topPerformer.name}</h4>
              <p className="text-muted-foreground">{teamStats.topPerformer.department}</p>
              
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-accent">{teamStats.topPerformer.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{teamStats.topPerformer.totalLeadsConverted}</p>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{teamStats.topPerformer.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No employees yet</p>
              <p className="text-sm mt-2">Add employees to see top performer</p>
            </div>
          )}
        </div>

        {/* Team Distribution */}
        {pieChartData.length > 0 ? (
          <TeamPieChart data={pieChartData} title="Team Contribution" />
        ) : (
          <div className="glass-card rounded-xl p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Add employees to see team distribution</p>
          </div>
        )}

        {/* AI Insights */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
          </div>
          
          <div className="space-y-4">
            {salesEmployees.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">
                  Add employees and log their activities to get AI insights.
                </p>
              </div>
            ) : (
              <>
                {teamStats.averageConversionRate >= 25 && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm font-medium text-success">🎉 Great Progress</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Team conversion rate of {teamStats.averageConversionRate}% is above average!
                    </p>
                  </div>
                )}
                
                {teamStats.employees.some(e => e.conversionRate < 20) && (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm font-medium text-warning">⚠️ Attention Needed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Some team members have conversion rates below 20%. Consider coaching sessions.
                    </p>
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm font-medium text-accent">💡 Suggestion</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track daily activities consistently to get accurate performance insights.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      {salesEmployees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {teamStats.employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                stats={{
                  totalCalls: emp.totalCalls,
                  totalLeadsConverted: emp.totalLeadsConverted,
                  conversionRate: emp.conversionRate,
                  target: emp.target,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage your sales team members</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => exportData('employees')}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="hero" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add New Employee
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {salesEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No employees yet</h3>
            <p className="text-muted-foreground mb-4">Add your first team member to get started</p>
            <Button variant="hero" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Department</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Calls</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Conversions</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rate</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Target Progress</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {salesEmployees
                .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((emp) => {
                  const stats = getWeeklyStats(emp.id);
                  const target = getEmployeeTarget(emp.id, currentMonth);
                  const progress = target ? Math.round((target.achievedValue / target.targetValue) * 100) : 0;
                  
                  return (
                    <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-medium text-foreground">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{emp.department}</td>
                      <td className="p-4 font-medium">{stats.totalCalls}</td>
                      <td className="p-4 font-medium text-success">{stats.totalLeadsConverted}</td>
                      <td className="p-4 font-medium">{stats.conversionRate}%</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                progress >= 80 ? 'bg-success' : 
                                progress >= 50 ? 'bg-warning' : 'bg-destructive'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">{progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(emp)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(emp)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderLeaveRequests = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-muted-foreground mt-1">Review and manage employee leave requests</p>
        </div>
        <Button variant="outline" onClick={() => exportData('leave')}>
          <Download className="w-4 h-4" />
          Export Leave Data
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {allLeaveRequests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No leave requests</h3>
            <p className="text-muted-foreground">Leave requests from employees will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allLeaveRequests.map((request) => {
              const employee = getEmployeeById(request.employeeId);
              return (
                <div key={request.id} className="p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {employee && (
                      <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{employee?.name || 'Unknown Employee'}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">{request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave</span>
                        {' · '}
                        {request.startDate} to {request.endDate}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied on: {request.appliedOn}
                      </p>
                      {request.reviewNote && (
                        <p className="text-sm mt-2 px-2 py-1 rounded bg-muted">
                          <span className="font-medium">Admin Note:</span> {request.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mr-2">
                      {getStatusIcon(request.status)}
                      <span className={`text-sm font-medium ${
                        request.status === 'approved' ? 'text-success' :
                        request.status === 'rejected' ? 'text-destructive' :
                        'text-warning'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleApproveLeave(request)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectClick(request)}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => {
    const handleMarkAllRead = () => {
      markAllNotificationsRead();
      toast.success('All notifications marked as read');
      setRefreshKey(prev => prev + 1);
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Employee login/logout and activity updates</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
              <p className="text-muted-foreground">Employee activities will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex items-start gap-4 ${!notification.read ? 'bg-accent/5' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'login' ? 'bg-success/10' :
                    notification.type === 'logout' ? 'bg-muted' :
                    notification.type === 'leave_request' ? 'bg-warning/10' :
                    notification.type === 'leave_approved' ? 'bg-success/10' :
                    'bg-destructive/10'
                  }`}>
                    {notification.type === 'login' && <LogIn className="w-5 h-5 text-success" />}
                    {notification.type === 'logout' && <LogOut className="w-5 h-5 text-muted-foreground" />}
                    {notification.type === 'leave_request' && <FileText className="w-5 h-5 text-warning" />}
                    {notification.type === 'leave_approved' && <CheckCircle className="w-5 h-5 text-success" />}
                    {notification.type === 'leave_rejected' && <XCircle className="w-5 h-5 text-destructive" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{notification.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const topPerformerPerformances = teamStats.topPerformer 
      ? getEmployeePerformances(teamStats.topPerformer.id)
      : [];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Detailed performance analytics and trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData('performances')}>
              <Download className="w-4 h-4" />
              Export Performances
            </Button>
            <Button variant="outline" onClick={() => exportData('attendance')}>
              <Download className="w-4 h-4" />
              Export Attendance
            </Button>
          </div>
        </div>

        {salesEmployees.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No data yet</h3>
            <p className="text-muted-foreground">Add employees and log activities to see analytics</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topPerformerPerformances.length > 0 && (
                <PerformanceChart 
                  data={topPerformerPerformances} 
                  title={`Top Performer Trend (${teamStats.topPerformer?.name})`} 
                />
              )}
              {pieChartData.length > 0 && (
                <TeamPieChart data={pieChartData} title="Team Contribution Distribution" />
              )}
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                      {salesEmployees.map(emp => (
                        <th key={emp.id} className="text-center py-3 px-4 font-medium text-muted-foreground">
                          {emp.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 px-4 font-medium">Total Calls</td>
                      {salesEmployees.map(emp => (
                        <td key={emp.id} className="text-center py-3 px-4">
                          {getWeeklyStats(emp.id).totalCalls}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Conversions</td>
                      {salesEmployees.map(emp => (
                        <td key={emp.id} className="text-center py-3 px-4 text-success font-medium">
                          {getWeeklyStats(emp.id).totalLeadsConverted}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Conversion Rate</td>
                      {salesEmployees.map(emp => (
                        <td key={emp.id} className="text-center py-3 px-4">
                          {getWeeklyStats(emp.id).conversionRate}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'employees': return renderEmployees();
      case 'leave-requests': return renderLeaveRequests();
      case 'notifications': return renderNotifications();
      case 'analytics': return renderAnalytics();
      case 'targets': return (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-4">Manage Targets</h1>
          <p className="text-muted-foreground">Edit employee targets from the Employees tab using the edit button.</p>
        </div>
      );
      case 'settings': return <AdminSettings />;
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

      {/* Modals */}
      <AddEmployeeModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={handleModalSuccess}
      />
      <EditEmployeeModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        employee={selectedEmployee}
        onSuccess={handleModalSuccess}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Employee"
        description={`Are you sure you want to delete ${selectedEmployee?.name}? This will also delete all their performance data and cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />

      {/* Reject Leave Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this leave request. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleRejectConfirm}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;