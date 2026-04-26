import React, { useState } from 'react';
import { Bus, Eye, EyeOff, User, Lock, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { localAuth } from '@/lib/localAuth';

export default function HomePage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ username: '', password: '', fullName: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        const result = localAuth.login(form.username, form.password);
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      } else {
        if (!form.fullName.trim()) { setError('Please enter your full name'); setLoading(false); return; }
        if (form.password.length < 4) { setError('Password must be at least 4 characters'); setLoading(false); return; }
        const result = localAuth.register(form.username.trim(), form.password, form.fullName.trim());
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      }
      setLoading(false);
    }, 300);
  };

  const switchMode = (newMode) => { setMode(newMode); setError(''); setForm({ username: '', password: '', fullName: '' }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">LimBus</h1>
          <p className="text-muted-foreground mt-1">Limpopo Public Bus Tracking System</p>
        </div>

        <Card className="shadow-xl border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to access your dashboard' : 'Register as a new passenger'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="e.g. Tshifhiwa Mudau"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="pl-10"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2 h-11" disabled={loading}>
                {mode === 'login'
                  ? <><LogIn className="w-4 h-4" />{loading ? 'Signing in...' : 'Sign In'}</>
                  : <><UserPlus className="w-4 h-4" />{loading ? 'Creating account...' : 'Create Account'}</>
                }
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} className="text-primary font-medium hover:underline">
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {mode === 'login' && (
              <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground text-center">
                Admin access: username <span className="font-mono font-semibold">admin</span> / password <span className="font-mono font-semibold">1234</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
