'use client';

import { SignupForm } from "@/components/signup-form"
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function Page() {
  const router = useRouter();

  const handleSignup = async (data: { email: string; password: string }) => {
    try {
      const res = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Signup failed");
        return;
      }

      toast.success("Account created successfully!");
      router.push("/");
    } catch (err) {
      console.error("Something went wrong:", err);
      toast.error("An unexpected error occurred");
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