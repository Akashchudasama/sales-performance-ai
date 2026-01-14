import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  User, 
  Lock, 
  Building, 
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateEmployee, getEmployees, clearAllData } from '@/lib/dataService';

const AdminSettings = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (!user) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      department: formData.department,
    };

    if (formData.newPassword) {
      updateData.password = formData.newPassword;
    }

    updateEmployee(user.id, updateData);
    toast.success('Profile updated successfully');
    setIsEditing(false);
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleClearAllData = () => {
    clearAllData();
    toast.success('All data has been cleared');
    logout();
  };

  const stats = {
    totalEmployees: getEmployees().filter(e => e.role === 'employee').length,
    totalAdmins: getEmployees().filter(e => e.role === 'admin').length,
    storageUsed: JSON.stringify(localStorage).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Profile Settings
            </h2>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleSaveProfile}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mb-8">
            <img 
              src={user?.avatar} 
              alt={user?.name}
              className="w-20 h-20 rounded-full ring-4 ring-accent/20"
            />
            <div>
              <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent mt-2 capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={!isEditing}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={user?.role || ''}
                disabled
                className="h-11 capitalize"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-md font-semibold text-foreground flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-accent" />
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Stats & Actions */}
        <div className="space-y-6">
          {/* System Stats */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-accent" />
              System Info
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Employees</span>
                <span className="font-semibold text-foreground">{stats.totalEmployees}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Admins</span>
                <span className="font-semibold text-foreground">{stats.totalAdmins}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-semibold text-foreground">
                  {(stats.storageUsed / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Data Storage</span>
                <span className="font-semibold text-accent">Local</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card rounded-xl p-6 border-2 border-destructive/20">
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Clear all data including employees, performance records, and targets. This action cannot be undone.
            </p>
            
            {!showClearConfirm ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive text-center">
                  Are you sure? This will delete everything!
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleClearAllData}
                  >
                    Yes, Clear All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
