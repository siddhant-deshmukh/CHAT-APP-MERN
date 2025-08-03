import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { post } from '@/lib/apiCall';
import type { IUser } from '@/types';
import useAppContext from '@/hooks/useAppContext';
import * as z from "zod/v4"; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, // We will hide this and use custom error display
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const defaultformState = {
  name: '',
  user_name: '',
  password: '',
}

const loginSchema = z.object({
  user_name: z.string().min(5, "user_name must be at least 5 characters long").max(15, "user_name must be at most 15 characters long"),
  password: z.string().min(5, "Password must be at least 5 characters long").max(20, "Password must be at most 20 characters long"),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").max(20, "Name must be at most 20 characters long"),
  user_name: z.string().min(5, "User Name must be at least 5 characters long").max(15, "User Name must be at most 15 characters long"),
  bio: z.string().min(0, "bio must be at least 5 characters long").max(100, "Bio must be at most 100 characters long"),
  password: z.string().min(5, "Password must be at least 5 characters long").max(20, "Password must be at most 20 characters long"),
});
type RegisterFormInputs = z.infer<typeof registerSchema>;


export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const { setUser } = useAppContext()

  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loginForm = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate on blur, showing errors only after interaction
    reValidateMode: "onChange",
    defaultValues: {
      user_name: "",
      password: "",
    },
  });

  // --- Register Form Hooks ---
  const registerForm = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur", // Validate on blur
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      user_name: "",
      password: "",
      bio: "",
    },
  });

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setForm((prev) => ({ ...prev, [name]: value }));
  //   setFormChanged(true);
  //   validate();
  //   setGeneralError('');
  // };

  const handleLogin = () => {
    // if (!validate()) return;
    setIsSubmitting(true);
    post<AuthResponse, LoginBody>('/login', loginForm.getValues())
      .then((res) => {
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
    // if (!validate()) return;
    setIsSubmitting(true);
    post<AuthResponse, RegisterBody>('/register', registerForm.getValues())
      .then((res) => {
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

  // const renderPasswordInput = () => (
  //   <div>
  //     <div className="relative">
  //       <Input
  //         type={showPassword ? 'text' : 'password'}
  //         name="password"
  //         placeholder="Password"
  //         value={form.password}
  //         onChange={handleChange}
  //         required
  //       />
  //       <button
  //         type="button"
  //         onClick={() => setShowPassword(!showPassword)}
  //         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
  //       >
  //         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  //       </button>
  //     </div>
  //     {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
  //   </div>
  // );

  const getInputClassName = (fieldName: string, formInstance: any) => {
    return formInstance.formState.errors[fieldName] ? "border-red-500" : "";
  };

  return (
    <div className="min-h-screen flex items-center w-full justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <Tabs
            value={activeTab} 
            // setErrors({ ...defaultformState }); setFormChanged(true); setGeneralError(''); 
            onValueChange={(val) => { setActiveTab(val as 'login' | 'register'); }}
            defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <div className="grid gap-4">
                    <FormField
                      control={loginForm.control}
                      name="user_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="User Name"
                              {...field}
                              className={getInputClassName("user_name", loginForm)}
                            />
                          </FormControl>
                          {/* We are hiding individual messages but react-hook-form needs FormMessage to register errors */}
                          <FormMessage className="hidden" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your password"
                              {...field}
                              className={getInputClassName("password", loginForm)}
                            />
                          </FormControl>
                          <FormMessage className="hidden" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Global Error Display for Login */}
                  {Object.keys(loginForm.formState.errors).length > 0 && (
                    <div className="text-red-500 text-sm font-medium mt-4">
                      {Object.values(loginForm.formState.errors).map((error, index) => (
                        <p key={index}>
                          {error?.message as string}
                        </p>
                      ))}
                    </div>
                  )}
                  


                  <Button disabled={isSubmitting} type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
            <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
              <div className="grid gap-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your full name"
                          {...field}
                          className={getInputClassName("name", registerForm)}
                        />
                      </FormControl>
                      <FormMessage className="hidden" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="user_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Choose a User name"
                          {...field}
                          className={getInputClassName("user_name", registerForm)}
                        />
                      </FormControl>
                      <FormMessage className="hidden" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Choose a bio"
                          {...field}
                          className={getInputClassName("bio", registerForm)}
                        />
                      </FormControl>
                      <FormMessage className="hidden" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          {...field}
                          className={getInputClassName("password", registerForm)}
                        />
                      </FormControl>
                      <FormMessage className="hidden" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Global Error Display for Register */}
              {Object.keys(registerForm.formState.errors).length > 0 && (
                <div className="text-red-500 text-sm font-medium mt-4">
                  {Object.values(registerForm.formState.errors).map((error, index) => (
                    <p key={index}>
                      {error?.message as string}
                    </p>
                  ))}
                </div>
              )}
              {/* {globalError && (
                <p className="text-red-500 text-sm font-medium mt-4">{globalError}</p>
              )} */}

              <Button disabled={isSubmitting} type="submit" className="w-full">
                Register
              </Button>
            </form>
          </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

type AuthResponse = { user: IUser } & { token: string }
type LoginBody = Pick<IUser, 'user_name'> & { password: string }
type RegisterBody = Pick<IUser, 'name' | 'user_name'> & { password: string }