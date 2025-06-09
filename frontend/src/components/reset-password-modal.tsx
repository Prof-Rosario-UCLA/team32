import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { API_URL } from '@/config/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters")
});

type ResetPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
};

export function ResetPasswordModal({ isOpen, onClose, token }: ResetPasswordModalProps) {
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: { password: string }) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch {
      setError("Failed to reset password");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError(null);
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogDescription>
          Enter your new password below.
        </DialogDescription>
        {success ? (
          <div className="text-green-600 text-center py-4">Your password has been reset! You can now sign in.</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="New password"
              {...form.register("password")}
              disabled={form.formState.isSubmitting}
            />
            {form.formState.errors.password && (
              <div className="text-red-600 text-sm">{form.formState.errors.password.message}</div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 