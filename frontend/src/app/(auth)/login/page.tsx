'use client';

import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function Page() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const res = await fetch("http://localhost:3001/api/users/login", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Login successful!");
      router.push("/");
    } catch (err) {
      console.error("Something went wrong:", err);
      toast.error("An unexpected error occurred");
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
