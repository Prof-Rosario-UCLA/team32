import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { API_URL } from '../../config/api';
import {type ForgotPasswordModalProps} from '../../types/modals';
import {emailSchema, codeSchema, passwordSchema} from '../../lib/validations/forgot-pw-schema';

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm<{ email: string }>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<{ code: string }>({ resolver: zodResolver(codeSchema) });
  const passwordForm = useForm<{ password: string }>({ resolver: zodResolver(passwordSchema) });

  const handleEmailSubmit = async (values: { email: string }) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email })
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(values.email);
        setStep("code");
      } else {
        setError(data.message || "Failed to send verification code");
      }
    } catch {
      setError("Failed to send verification code");
    }
  };

  // Step 2: Verify code
  const handleCodeSubmit = async (values: { code: string }) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: values.code })
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken);
        setStep("password");
      } else {
        setError(data.message || "Invalid or expired code");
      }
    } catch {
      setError("Failed to verify code");
    }
  };

  // Step 3: Set new password
  const handlePasswordSubmit = async (values: { password: string }) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: values.password })
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch {
      setError("Failed to reset password");
    }
  };
  
  const handleClose = () => {
    setStep("email");
    setEmail("");
    setResetToken(null);
    setError(null);
    emailForm.reset();
    codeForm.reset();
    passwordForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogDescription>
          {step === "email" && "Enter your email to receive a verification code."}
          {step === "code" && `Enter the 6-digit code sent to ${email}.`}
          {step === "password" && "Enter your new password."}
          {step === "success" && "Your password has been reset! You can now sign in."}
        </DialogDescription>
        {step === "email" && (
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Email"
              {...emailForm.register("email")}
              disabled={emailForm.formState.isSubmitting}
            />
            {emailForm.formState.errors.email && (
              <div className="text-red-600 text-sm">{emailForm.formState.errors.email.message}</div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting ? "Sending..." : "Send Code"}
            </Button>
          </form>
        )}
        {step === "code" && (
          <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="6-digit code"
              maxLength={6}
              {...codeForm.register("code")}
              disabled={codeForm.formState.isSubmitting}
            />
            {codeForm.formState.errors.code && (
              <div className="text-red-600 text-sm">{codeForm.formState.errors.code.message}</div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" disabled={codeForm.formState.isSubmitting}>
              {codeForm.formState.isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        )}
        {step === "password" && (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="New password"
              {...passwordForm.register("password")}
              disabled={passwordForm.formState.isSubmitting}
            />
            {passwordForm.formState.errors.password && (
              <div className="text-red-600 text-sm">{passwordForm.formState.errors.password.message}</div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
        {step === "success" && (
          <div className="text-green-600 text-center py-4">Your password has been reset! You can now sign in.</div>
        )}
      </DialogContent>
    </Dialog>
  );
} 