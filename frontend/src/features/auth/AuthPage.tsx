'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff } from 'lucide-react';
import useAppContext from '@/hooks/useAppContext';
import { post } from '@/lib/apiCall';

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useAppContext();

  const [form, setForm] = useState({
    name: '',
    user_name: '',
    password: '',
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.user_name || form.user_name.length < 3) {
      errs.user_name = 'Username must be at least 3 characters';
    }

    if (!form.password || form.password.length < 5) {
      errs.password = 'Password must be at least 5 characters';
    }

    if (activeTab === 'register') {
      if (!form.name || form.name.length < 3) {
        errs.name = 'Name must be at least 3 characters';
      }
      if (form.bio.length > 100) {
        errs.bio = 'Bio must be at most 100 characters';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleLogin = () => {
    if (!validate()) return;

    setIsSubmitting(true);
    post('/login', {
      user_name: form.user_name,
      password: form.password,
    })
      .then((res: any) => {
        if (res && res.user && res.user._id) {
          localStorage.setItem('authToken', res.token);
          setUser(res.user);
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleRegister = () => {
    if (!validate()) return;

    setIsSubmitting(true);
    post('/register', form)
      .then((res: any) => {
        if (res && res.user && res.user._id) {
          localStorage.setItem('authToken', res.token);
          setUser(res.user);
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="w-full max-w-md border border-white shadow-md rounded-2xl p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'login' | 'register')}>
          <TabsList className="w-full grid grid-cols-2 mb-10">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Username"
                  value={form.user_name}
                  onChange={(e) => handleInputChange('user_name', e.target.value)}
                />
                {errors.user_name && <p className="text-sm text-red-500">{errors.user_name}</p>}
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <Input
                  placeholder="Username"
                  value={form.user_name}
                  onChange={(e) => handleInputChange('user_name', e.target.value)}
                />
                {errors.user_name && <p className="text-sm text-red-500">{errors.user_name}</p>}
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div>
                <Textarea
                  placeholder="Bio (optional, max 100 chars)"
                  value={form.bio}
                  maxLength={100}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                />
                {errors.bio && <p className="text-sm text-red-500">{errors.bio}</p>}
              </div>

              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
