'use client';

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/auth-context";
import { toast, Toaster } from "sonner";

export default function Page() {
  const { login } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login(data.email, data.password);
      toast.success("Login successful!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };
  
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onSubmit={handleLogin} />
        <Toaster />
      </div>
    </div>
  );
}
