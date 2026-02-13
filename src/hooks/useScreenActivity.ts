import { useState, useEffect, useCallback, useRef } from 'react';
import { generateId } from '@/lib/dataService';

export interface ActivitySession {
  id: string;
  employeeId: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  idlePeriods: { start: string; end?: string }[];
  totalIdleMinutes: number;
  totalSessionMinutes: number;
  productiveMinutes: number;
  isActive: boolean;
}

const STORAGE_KEY = 'salestrack_screen_activity';
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const getActivitySessions = (): ActivitySession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveActivitySessions = (sessions: ActivitySession[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new CustomEvent('localStorage-update', { detail: { key: STORAGE_KEY } }));
};

export const getEmployeeActivitySessions = (employeeId: string, date?: string): ActivitySession[] => {
  return getActivitySessions()
    .filter(s => s.employeeId === employeeId && (!date || s.date === date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getTodayActivitySummary = (employeeId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const sessions = getEmployeeActivitySessions(employeeId, today);
  
  if (sessions.length === 0) {
    return null;
  }

  const session = sessions[0];
  return {
    loginTime: session.loginTime,
    logoutTime: session.logoutTime,
    totalSessionMinutes: session.totalSessionMinutes,
    totalIdleMinutes: session.totalIdleMinutes,
    productiveMinutes: session.productiveMinutes,
    idlePeriods: session.idlePeriods,
    isActive: session.isActive,
  };
};

export const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} min`;
  return `${h} hr ${m} min`;
};

export const useScreenActivity = (employeeId: string | undefined) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [session, setSession] = useState<ActivitySession | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<ActivitySession | null>(null);

  const updateSession = useCallback(() => {
    if (!sessionRef.current) return;
    const now = new Date();
    const loginTime = parseTime(sessionRef.current.loginTime);
    const totalSessionMs = now.getTime() - loginTime.getTime();
    const totalSessionMinutes = Math.max(0, totalSessionMs / 60000);
    
    // Calculate total idle minutes
    let totalIdleMs = 0;
    for (const period of sessionRef.current.idlePeriods) {
      const start = parseTime(period.start);
      const end = period.end ? parseTime(period.end) : now;
      totalIdleMs += end.getTime() - start.getTime();
    }
    const totalIdleMinutes = Math.max(0, totalIdleMs / 60000);
    const productiveMinutes = Math.max(0, totalSessionMinutes - totalIdleMinutes);

    sessionRef.current = {
      ...sessionRef.current,
      totalSessionMinutes: Math.round(totalSessionMinutes * 100) / 100,
      totalIdleMinutes: Math.round(totalIdleMinutes * 100) / 100,
      productiveMinutes: Math.round(productiveMinutes * 100) / 100,
    };

    // Save to localStorage
    const sessions = getActivitySessions();
    const idx = sessions.findIndex(s => s.id === sessionRef.current!.id);
    if (idx !== -1) {
      sessions[idx] = sessionRef.current;
    }
    saveActivitySessions(sessions);
    setSession({ ...sessionRef.current });
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!sessionRef.current || !isTracking) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // If currently idle, mark end of idle period
    if (sessionRef.current.isActive === false) {
      const periods = [...sessionRef.current.idlePeriods];
      const lastPeriod = periods[periods.length - 1];
      if (lastPeriod && !lastPeriod.end) {
        lastPeriod.end = new Date().toTimeString().slice(0, 8);
        sessionRef.current = { ...sessionRef.current, idlePeriods: periods, isActive: true };
        setIsIdle(false);
        updateSession();
      }
    }

    idleTimerRef.current = setTimeout(() => {
      if (!sessionRef.current) return;
      // Mark as idle
      const periods = [...sessionRef.current.idlePeriods];
      periods.push({ start: new Date().toTimeString().slice(0, 8) });
      sessionRef.current = { ...sessionRef.current, idlePeriods: periods, isActive: false };
      setIsIdle(true);
      updateSession();
    }, IDLE_THRESHOLD_MS);
  }, [isTracking, updateSession]);

  const startTracking = useCallback(() => {
    if (!employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 8);

    // Check for existing session today
    const sessions = getActivitySessions();
    const existing = sessions.find(s => s.employeeId === employeeId && s.date === today && !s.logoutTime);

    if (existing) {
      sessionRef.current = existing;
      setSession(existing);
      setIsTracking(true);
      return;
    }

    const newSession: ActivitySession = {
      id: generateId(),
      employeeId,
      date: today,
      loginTime: now,
      idlePeriods: [],
      totalIdleMinutes: 0,
      totalSessionMinutes: 0,
      productiveMinutes: 0,
      isActive: true,
    };

    sessions.push(newSession);
    saveActivitySessions(sessions);
    sessionRef.current = newSession;
    setSession(newSession);
    setIsTracking(true);
  }, [employeeId]);

  const stopTracking = useCallback(() => {
    if (!sessionRef.current) return;

    // Close any open idle period
    const periods = [...sessionRef.current.idlePeriods];
    const lastPeriod = periods[periods.length - 1];
    if (lastPeriod && !lastPeriod.end) {
      lastPeriod.end = new Date().toTimeString().slice(0, 8);
    }

    sessionRef.current = {
      ...sessionRef.current,
      logoutTime: new Date().toTimeString().slice(0, 8),
      idlePeriods: periods,
      isActive: false,
    };

    updateSession();

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

    setIsTracking(false);
    setIsIdle(false);
    setSession({ ...sessionRef.current });
  }, [updateSession]);

  // Listen for activity events
  useEffect(() => {
    if (!isTracking) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));

    // Update session every 30 seconds
    updateIntervalRef.current = setInterval(updateSession, 30000);

    // Start idle timer
    resetIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [isTracking, resetIdleTimer, updateSession]);

  // Load existing session on mount
  useEffect(() => {
    if (!employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const sessions = getActivitySessions();
    const existing = sessions.find(s => s.employeeId === employeeId && s.date === today);
    if (existing) {
      sessionRef.current = existing;
      setSession(existing);
      if (!existing.logoutTime) {
        setIsTracking(true);
      }
    }
  }, [employeeId]);

  return { isTracking, isIdle, session, startTracking, stopTracking };
};

function parseTime(timeStr: string): Date {
  const today = new Date();
  const parts = timeStr.split(':').map(Number);
  today.setHours(parts[0], parts[1], parts[2] || 0, 0);
  return today;
}
