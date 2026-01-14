import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Users, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'employee' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = login(email, password, selectedRole);
    
    if (success) {
      toast.success('Welcome back!');
    } else {
      toast.error('Invalid credentials', {
        description: `No ${selectedRole} found with this email. Try admin@glowlogics.com for admin access.`,
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(173,58%,39%,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(222,47%,30%,0.3),transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center pulse-glow">
              <TrendingUp className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-white">Glowlogics Solution</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Track Performance.<br />
            <span className="text-gradient">Drive Results.</span>
          </h1>
          
          <p className="text-lg text-white/70 mb-10 max-w-md">
            Employee performance tracking system with localStorage storage. 
            All your data stays on your computer.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📊', text: 'Real-time analytics dashboard' },
              { icon: '🎯', text: 'Target tracking & monitoring' },
              { icon: '💾', text: 'Data stored locally on your PC' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-white/80 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-xl">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/20 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Glowlogics Solution</span>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
          </div>

          <div className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Select your role</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedRole('employee')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedRole === 'employee'
                      ? 'border-accent bg-accent/5 shadow-lg'
                      : 'border-border hover:border-accent/50 hover:bg-muted/50'
                  }`}
                >
                  <Users className={`w-8 h-8 mx-auto mb-2 ${
                    selectedRole === 'employee' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                  <p className={`font-medium ${
                    selectedRole === 'employee' ? 'text-accent' : 'text-foreground'
                  }`}>Employee</p>
                  <p className="text-xs text-muted-foreground mt-1">Sales Executive</p>
                </button>

                <button
                  onClick={() => setSelectedRole('admin')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedRole === 'admin'
                      ? 'border-accent bg-accent/5 shadow-lg'
                      : 'border-border hover:border-accent/50 hover:bg-muted/50'
                  }`}
                >
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${
                    selectedRole === 'admin' ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                  <p className={`font-medium ${
                    selectedRole === 'admin' ? 'text-accent' : 'text-foreground'
                  }`}>Admin</p>
                  <p className="text-xs text-muted-foreground mt-1">Manager</p>
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Login Button */}
            <Button 
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleLogin}
              disabled={!selectedRole || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="p-4 rounded-lg bg-muted text-sm">
              <p className="font-medium text-foreground mb-2">Quick Start:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Admin: <code className="text-accent">admin@glowlogics.com</code></li>
                <li>• Password: <code className="text-accent">123456</code></li>
                <li>• Add employees from Admin dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
