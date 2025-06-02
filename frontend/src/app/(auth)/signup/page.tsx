'use client';

import { SignupForm } from "@/components/signup-form"
import { useAuth } from "@/contexts/auth-context";
import { toast, Toaster } from "sonner";

export default function Page() {
  const { signup } = useAuth();

  const handleSignup = async (data: { email: string; password: string }) => {
    try {
      await signup(data.email, data.password);
      toast.success("Account created successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Signup failed. Please try again.");
      }
    }
  };
  
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm onSubmit={handleSignup} />
        <Toaster />
      </div>
    </div>
  );
}