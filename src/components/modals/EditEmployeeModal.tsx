import { useState, useEffect } from 'react';
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
import { Employee, updateEmployee, getEmployeeTarget, addTarget, getCurrentMonth } from '@/lib/dataService';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

const EditEmployeeModal = ({ open, onOpenChange, employee, onSuccess }: EditEmployeeModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Sales',
    password: '',
    targetValue: '100',
    revenueTarget: '100000',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      const target = getEmployeeTarget(employee.id, getCurrentMonth());
      setFormData({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        password: '',
        targetValue: target?.targetValue.toString() || '100',
        revenueTarget: target?.revenueTarget?.toString() || '100000',
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee || !formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const updates: Partial<Employee> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
      };
      
      if (formData.password) {
        updates.password = formData.password;
      }

      updateEmployee(employee.id, updates);

      // Update or create target
      if (employee.role === 'employee') {
        const existingTarget = getEmployeeTarget(employee.id, getCurrentMonth());
        if (existingTarget) {
          // Keep achieved value, just update target
          addTarget({
            employeeId: employee.id,
            month: getCurrentMonth(),
            targetValue: parseInt(formData.targetValue) || 100,
            achievedValue: existingTarget.achievedValue,
            revenueTarget: parseFloat(formData.revenueTarget) || 100000,
            revenueAchieved: existingTarget.revenueAchieved,
          });
        } else {
          addTarget({
            employeeId: employee.id,
            month: getCurrentMonth(),
            targetValue: parseInt(formData.targetValue) || 100,
            achievedValue: 0,
            revenueTarget: parseFloat(formData.revenueTarget) || 100000,
            revenueAchieved: 0,
          });
        }
      }

      toast.success('Employee updated successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to update employee');
    } finally {
      setIsLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-accent" />
            Edit Employee
          </DialogTitle>
          <DialogDescription>
            Update employee information and targets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password (optional)</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="Leave empty to keep current"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
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

          {employee.role === 'employee' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-target">Monthly Target (Conversions)</Label>
                <Input
                  id="edit-target"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-revenue-target">Monthly Revenue Target (₹)</Label>
                <Input
                  id="edit-revenue-target"
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeModal;
