// Data Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'employee' | 'admin';
  department: string;
  joinDate: string;
  password?: string;
}

export interface DailyPerformance {
  id: string;
  employeeId: string;
  date: string;
  callsMade: number;
  leadsContacted: number;
  leadsConverted: number;
  revenueGenerated: number;
  revenuePending: number;
}

export interface Target {
  id: string;
  employeeId: string;
  month: string;
  targetValue: number;
  achievedValue: number;
  revenueTarget: number;
  revenueAchieved: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'leave' | 'half-day';
  workingHours?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'sick' | 'casual' | 'annual' | 'emergency' | 'half-day';
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  reviewNote?: string;
}

export interface Notification {
  id: string;
  type: 'login' | 'logout' | 'leave_request' | 'leave_approved' | 'leave_rejected';
  employeeId: string;
  employeeName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// LocalStorage Keys
const STORAGE_KEYS = {
  EMPLOYEES: 'salestrack_employees',
  PERFORMANCES: 'salestrack_performances',
  TARGETS: 'salestrack_targets',
  ATTENDANCE: 'salestrack_attendance',
  LEAVE_REQUESTS: 'salestrack_leave_requests',
  NOTIFICATIONS: 'salestrack_notifications',
};

// Clear all data from localStorage
export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
  localStorage.removeItem(STORAGE_KEYS.PERFORMANCES);
  localStorage.removeItem(STORAGE_KEYS.TARGETS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.LEAVE_REQUESTS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { cleared: true } }));
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generate avatar URL
export const generateAvatar = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
};

// ============= EMPLOYEES =============

export const getEmployees = (): Employee[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveEmployees = (employees: Employee[]) => {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.EMPLOYEES } }));
};

export const addEmployee = (employee: Omit<Employee, 'id' | 'avatar'>): Employee => {
  const employees = getEmployees();
  const newEmployee: Employee = {
    ...employee,
    id: generateId(),
    avatar: generateAvatar(employee.name),
  };
  employees.push(newEmployee);
  saveEmployees(employees);
  return newEmployee;
};

export const updateEmployee = (id: string, updates: Partial<Employee>): Employee | null => {
  const employees = getEmployees();
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  employees[index] = { ...employees[index], ...updates };
  if (updates.name) {
    employees[index].avatar = generateAvatar(updates.name);
  }
  saveEmployees(employees);
  return employees[index];
};

export const deleteEmployee = (id: string): boolean => {
  const employees = getEmployees();
  const filtered = employees.filter(e => e.id !== id);
  if (filtered.length === employees.length) return false;
  
  saveEmployees(filtered);
  // Also delete related performances, targets, attendance, and leave requests
  const performances = getPerformances().filter(p => p.employeeId !== id);
  savePerformances(performances);
  const targets = getTargets().filter(t => t.employeeId !== id);
  saveTargets(targets);
  const attendance = getAttendanceRecords().filter(a => a.employeeId !== id);
  saveAttendanceRecords(attendance);
  const leaveRequests = getLeaveRequests().filter(l => l.employeeId !== id);
  saveLeaveRequests(leaveRequests);
  
  return true;
};

export const getEmployeeById = (id: string): Employee | undefined => {
  return getEmployees().find(e => e.id === id);
};

export const getSalesEmployees = (): Employee[] => {
  return getEmployees().filter(e => e.role === 'employee');
};

export const authenticateUser = (email: string, password: string, role: 'employee' | 'admin'): Employee | null => {
  const employees = getEmployees();
  const user = employees.find(e => 
    e.email.toLowerCase() === email.toLowerCase() && 
    e.role === role &&
    (e.password === password || !e.password) // Allow empty password for demo
  );
  return user || null;
};

// ============= PERFORMANCES =============

export const getPerformances = (): DailyPerformance[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PERFORMANCES);
    const performances = data ? JSON.parse(data) : [];
    // Migrate old data without revenue fields
    return performances.map((p: any) => ({
      ...p,
      revenueGenerated: p.revenueGenerated ?? 0,
      revenuePending: p.revenuePending ?? 0,
    }));
  } catch {
    return [];
  }
};

export const savePerformances = (performances: DailyPerformance[]) => {
  localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(performances));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.PERFORMANCES } }));
};

export const addPerformance = (performance: Omit<DailyPerformance, 'id'>): DailyPerformance => {
  const performances = getPerformances();
  
  // Check if entry exists for this employee and date
  const existingIndex = performances.findIndex(
    p => p.employeeId === performance.employeeId && p.date === performance.date
  );
  
  if (existingIndex !== -1) {
    // Update existing entry
    performances[existingIndex] = { ...performances[existingIndex], ...performance };
    savePerformances(performances);
    updateTargetAchieved(performance.employeeId);
    return performances[existingIndex];
  }
  
  const newPerformance: DailyPerformance = {
    ...performance,
    id: generateId(),
  };
  performances.push(newPerformance);
  savePerformances(performances);
  
  // Update target achieved value
  updateTargetAchieved(performance.employeeId);
  
  return newPerformance;
};

export const updatePerformance = (id: string, updates: Partial<DailyPerformance>): DailyPerformance | null => {
  const performances = getPerformances();
  const index = performances.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  performances[index] = { ...performances[index], ...updates };
  savePerformances(performances);
  updateTargetAchieved(performances[index].employeeId);
  return performances[index];
};

export const getEmployeePerformances = (employeeId: string): DailyPerformance[] => {
  return getPerformances()
    .filter(p => p.employeeId === employeeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deletePerformance = (id: string): boolean => {
  const performances = getPerformances();
  const perf = performances.find(p => p.id === id);
  const filtered = performances.filter(p => p.id !== id);
  if (filtered.length === performances.length) return false;
  
  savePerformances(filtered);
  if (perf) {
    updateTargetAchieved(perf.employeeId);
  }
  return true;
};

// ============= TARGETS =============

export const getTargets = (): Target[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TARGETS);
    const targets = data ? JSON.parse(data) : [];
    // Migrate old data without revenue fields
    return targets.map((t: any) => ({
      ...t,
      revenueTarget: t.revenueTarget ?? 0,
      revenueAchieved: t.revenueAchieved ?? 0,
    }));
  } catch {
    return [];
  }
};

export const saveTargets = (targets: Target[]) => {
  localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.TARGETS } }));
};

export const addTarget = (target: Omit<Target, 'id'>): Target => {
  const targets = getTargets();
  
  // Check if target exists for this employee and month
  const existingIndex = targets.findIndex(
    t => t.employeeId === target.employeeId && t.month === target.month
  );
  
  if (existingIndex !== -1) {
    targets[existingIndex] = { ...targets[existingIndex], ...target };
    saveTargets(targets);
    return targets[existingIndex];
  }
  
  const newTarget: Target = {
    ...target,
    id: generateId(),
  };
  targets.push(newTarget);
  saveTargets(targets);
  return newTarget;
};

export const updateTarget = (id: string, updates: Partial<Target>): Target | null => {
  const targets = getTargets();
  const index = targets.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  targets[index] = { ...targets[index], ...updates };
  saveTargets(targets);
  return targets[index];
};

export const getEmployeeTarget = (employeeId: string, month: string): Target | undefined => {
  return getTargets().find(t => t.employeeId === employeeId && t.month === month);
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const updateTargetAchieved = (employeeId: string) => {
  const currentMonth = getCurrentMonth();
  const performances = getEmployeePerformances(employeeId);
  const monthPerformances = performances.filter(p => p.date.startsWith(currentMonth));
  const totalConverted = monthPerformances.reduce((sum, p) => sum + p.leadsConverted, 0);
  const totalRevenue = monthPerformances.reduce((sum, p) => sum + p.revenueGenerated, 0);
  
  const target = getEmployeeTarget(employeeId, currentMonth);
  if (target) {
    updateTarget(target.id, { achievedValue: totalConverted, revenueAchieved: totalRevenue });
  }
};

// ============= ATTENDANCE =============

export const getAttendanceRecords = (): Attendance[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveAttendanceRecords = (records: Attendance[]) => {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.ATTENDANCE } }));
};

export const checkIn = (employeeId: string): Attendance => {
  const records = getAttendanceRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  
  // Check if already checked in today
  const existingIndex = records.findIndex(
    r => r.employeeId === employeeId && r.date === today
  );
  
  if (existingIndex !== -1) {
    // Update existing record
    records[existingIndex].checkIn = now;
    records[existingIndex].status = 'present';
    saveAttendanceRecords(records);
    return records[existingIndex];
  }
  
  const newRecord: Attendance = {
    id: generateId(),
    employeeId,
    date: today,
    checkIn: now,
    status: 'present',
  };
  records.push(newRecord);
  saveAttendanceRecords(records);
  return newRecord;
};

export const checkOut = (employeeId: string): Attendance | null => {
  const records = getAttendanceRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  
  const index = records.findIndex(
    r => r.employeeId === employeeId && r.date === today
  );
  
  if (index === -1 || !records[index].checkIn) return null;
  
  records[index].checkOut = now;
  
  // Calculate working hours
  const checkInTime = records[index].checkIn!.split(':').map(Number);
  const checkOutTime = now.split(':').map(Number);
  const hours = (checkOutTime[0] * 60 + checkOutTime[1] - checkInTime[0] * 60 - checkInTime[1]) / 60;
  records[index].workingHours = parseFloat(hours.toFixed(2));
  
  // Keep status as present (don't auto-set half-day based on hours)
  // Half-day is only set via approved half-day leave request
  
  saveAttendanceRecords(records);
  return records[index];
};

export const getTodayAttendance = (employeeId: string): Attendance | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return getAttendanceRecords().find(r => r.employeeId === employeeId && r.date === today);
};

export const getEmployeeAttendance = (employeeId: string, month?: string): Attendance[] => {
  return getAttendanceRecords()
    .filter(r => r.employeeId === employeeId && (!month || r.date.startsWith(month)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getAttendanceStats = (employeeId: string, month: string) => {
  const records = getEmployeeAttendance(employeeId, month);
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leave = records.filter(r => r.status === 'leave').length;
  const halfDay = records.filter(r => r.status === 'half-day').length;
  const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
  
  return { present, absent, leave, halfDay, totalHours: parseFloat(totalHours.toFixed(2)) };
};

// ============= LEAVE REQUESTS =============

export const getLeaveRequests = (): LeaveRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLeaveRequests = (requests: LeaveRequest[]) => {
  localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.LEAVE_REQUESTS } }));
};

export const addLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>): LeaveRequest => {
  const requests = getLeaveRequests();
  
  const newRequest: LeaveRequest = {
    ...request,
    id: generateId(),
    appliedOn: new Date().toISOString().split('T')[0],
    status: 'pending',
  };
  requests.push(newRequest);
  saveLeaveRequests(requests);
  return newRequest;
};

export const updateLeaveRequest = (id: string, updates: Partial<LeaveRequest>): LeaveRequest | null => {
  const requests = getLeaveRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  requests[index] = { ...requests[index], ...updates };
  saveLeaveRequests(requests);
  
  // If approved, mark those dates as leave in attendance
  if (updates.status === 'approved') {
    const request = requests[index];
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const attendanceRecords = getAttendanceRecords();
    const isHalfDay = request.leaveType === 'half-day';
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingIndex = attendanceRecords.findIndex(
        a => a.employeeId === request.employeeId && a.date === dateStr
      );
      
      const status = isHalfDay ? 'half-day' : 'leave';
      
      if (existingIndex !== -1) {
        attendanceRecords[existingIndex].status = status;
      } else {
        attendanceRecords.push({
          id: generateId(),
          employeeId: request.employeeId,
          date: dateStr,
          status: status,
        });
      }
    }
    saveAttendanceRecords(attendanceRecords);
  }
  
  return requests[index];
};

export const getEmployeeLeaveRequests = (employeeId: string): LeaveRequest[] => {
  return getLeaveRequests()
    .filter(r => r.employeeId === employeeId)
    .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
};

export const getPendingLeaveRequests = (): LeaveRequest[] => {
  return getLeaveRequests()
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.appliedOn).getTime() - new Date(b.appliedOn).getTime());
};

// ============= NOTIFICATIONS =============

export const getNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEYS.NOTIFICATIONS } }));
};

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification => {
  const notifications = getNotifications();
  
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification); // Add to beginning
  
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop();
  }
  
  saveNotifications(notifications);
  return newNotification;
};

export const markNotificationRead = (id: string): void => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    saveNotifications(notifications);
  }
};

export const markAllNotificationsRead = (): void => {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveNotifications(notifications);
};

export const getUnreadNotificationsCount = (): number => {
  return getNotifications().filter(n => !n.read).length;
};

export const getAllLeaveRequests = (): LeaveRequest[] => {
  return getLeaveRequests()
    .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
};

export const getActiveEmployees = () => {
  const today = new Date().toISOString().split('T')[0];
  const attendance = getAttendanceRecords().filter(r => r.date === today);
  const employees = getSalesEmployees();
  
  return employees.map(emp => {
    const todayRecord = attendance.find(a => a.employeeId === emp.id);
    return {
      ...emp,
      isCheckedIn: !!todayRecord?.checkIn,
      isCheckedOut: !!todayRecord?.checkOut,
      checkInTime: todayRecord?.checkIn,
      checkOutTime: todayRecord?.checkOut,
      workingHours: todayRecord?.workingHours,
      status: todayRecord?.status || 'absent',
    };
  });
};

// ============= STATISTICS =============

export const calculateConversionRate = (leadsContacted: number, leadsConverted: number): number => {
  if (leadsContacted === 0) return 0;
  return Math.round((leadsConverted / leadsContacted) * 100);
};

export const getPerformanceLevel = (conversionRate: number): 'excellent' | 'average' | 'poor' => {
  if (conversionRate >= 30) return 'excellent';
  if (conversionRate >= 20) return 'average';
  return 'poor';
};

export const getWeeklyStats = (employeeId: string) => {
  const performances = getEmployeePerformances(employeeId);
  const lastWeek = performances.slice(0, 7); // Last 7 entries
  
  const totalCalls = lastWeek.reduce((sum, p) => sum + p.callsMade, 0);
  const totalLeadsContacted = lastWeek.reduce((sum, p) => sum + p.leadsContacted, 0);
  const totalLeadsConverted = lastWeek.reduce((sum, p) => sum + p.leadsConverted, 0);
  const totalRevenue = lastWeek.reduce((sum, p) => sum + p.revenueGenerated, 0);
  const totalPending = lastWeek.reduce((sum, p) => sum + p.revenuePending, 0);
  
  return {
    totalCalls,
    totalLeadsContacted,
    totalLeadsConverted,
    totalRevenue,
    totalPending,
    conversionRate: calculateConversionRate(totalLeadsContacted, totalLeadsConverted),
    avgCallsPerDay: lastWeek.length > 0 ? Math.round(totalCalls / lastWeek.length) : 0,
  };
};

export const getTeamStats = () => {
  const salesEmployees = getSalesEmployees();
  const currentMonth = getCurrentMonth();
  
  const stats = salesEmployees.map(emp => ({
    ...emp,
    ...getWeeklyStats(emp.id),
    target: getEmployeeTarget(emp.id, currentMonth),
  }));
  
  const totalTeamCalls = stats.reduce((sum, s) => sum + s.totalCalls, 0);
  const totalTeamConversions = stats.reduce((sum, s) => sum + s.totalLeadsConverted, 0);
  const totalTeamRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalTeamPending = stats.reduce((sum, s) => sum + s.totalPending, 0);
  
  const sortedByConversion = [...stats].sort((a, b) => b.conversionRate - a.conversionRate);
  
  return {
    employees: stats,
    totalTeamCalls,
    totalTeamConversions,
    totalTeamRevenue,
    totalTeamPending,
    topPerformer: sortedByConversion[0] || null,
    averageConversionRate: stats.length > 0 
      ? Math.round(stats.reduce((sum, s) => sum + s.conversionRate, 0) / stats.length) 
      : 0,
  };
};

// ============= INITIALIZATION =============

export const initializeDefaultAdmin = () => {
  const employees = getEmployees();
  const hasNewAdmin = employees.some(e => e.email === 'admin@glowlogics.com');
  
  if (!hasNewAdmin) {
    // Remove old admin if exists
    const filtered = employees.filter(e => e.email !== 'admin@company.com');
    saveEmployees(filtered);
    
    // Add new admin
    addEmployee({
      name: 'Admin User',
      email: 'admin@glowlogics.com',
      role: 'admin',
      department: 'Management',
      joinDate: new Date().toISOString().split('T')[0],
      password: '123456',
    });
  }
};
