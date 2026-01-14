import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addEmployee, addTarget, getCurrentMonth } from '@/lib/dataService';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddEmployeeModal = ({ open, onOpenChange, onSuccess }: AddEmployeeModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as 'employee' | 'admin',
    department: 'Sales',
    password: '',
    targetValue: '100',
    revenueTarget: '100000',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const newEmployee = addEmployee({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        department: formData.department,
        joinDate: new Date().toISOString().split('T')[0],
        password: formData.password || undefined,
      });

      // Create target for new employee if they are sales
      if (formData.role === 'employee') {
        addTarget({
          employeeId: newEmployee.id,
          month: getCurrentMonth(),
          targetValue: parseInt(formData.targetValue) || 100,
          achievedValue: 0,
          revenueTarget: parseFloat(formData.revenueTarget) || 100000,
          revenueAchieved: 0,
        });
      }

      toast.success('Employee added successfully!', {
        description: `${formData.name} has been added to the team.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'employee',
        department: 'Sales',
        password: '',
        targetValue: '100',
        revenueTarget: '100000',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to add employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Add a new team member to the system. They'll be able to log in and track their performance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave empty for demo access"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'employee' | 'admin') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === 'employee' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="target">Monthly Target (Conversions)</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueTarget">Monthly Revenue Target (₹)</Label>
                <Input
                  id="revenueTarget"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="100000"
                  value={formData.revenueTarget}
                  onChange={(e) => setFormData({ ...formData, revenueTarget: e.target.value })}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
