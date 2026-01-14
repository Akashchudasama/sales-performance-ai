import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  TrendingUp, 
  Settings, 
  LogOut,
  Phone,
  BarChart3,
  ChevronLeft,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-entry', label: 'Daily Entry', icon: Phone },
    { id: 'my-targets', label: 'My Targets', icon: Target },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'leave-requests', label: 'Leave Requests', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'targets', label: 'Manage Targets', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-sidebar-foreground text-lg">Glowlogics Solution</h1>
              <p className="text-xs text-sidebar-foreground/60">Performance Hub</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border shadow-md hover:bg-sidebar-primary"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-sidebar-foreground transition-transform",
          collapsed && "rotate-180"
        )} />
      </Button>

      {/* User Info */}
      <div className={cn(
        "p-4 border-b border-sidebar-border",
        collapsed && "px-2"
      )}>
        <div className="flex items-center gap-3">
          <img 
            src={user?.avatar} 
            alt={user?.name}
            className="w-10 h-10 rounded-full ring-2 ring-sidebar-primary flex-shrink-0"
          />
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in">
              <p className="font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "sidebar-nav-item w-full",
              activeTab === item.id && "sidebar-nav-item-active",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={cn(
            "sidebar-nav-item w-full text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
