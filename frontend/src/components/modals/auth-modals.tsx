import { Dialog, DialogContent, DialogTitle } from "@/../components/ui/dialog";
import { LoginForm } from "../forms/login-form";
import { SignupForm } from "../forms/signup-form";
import { useAuth } from "@/../contexts/auth-context";
import { toast } from "sonner";
import {AuthModalsProps} from "@/../types/modals";

export function AuthModals({ 
  isLoginOpen, 
  isSignupOpen, 
  onLoginClose, 
  onSignupClose, 
  onLoginOpen,
  onSignupOpen,
}: AuthModalsProps) {
  const { login, signup } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login(data.email, data.password);
      toast.success("Login successful!");
      onLoginClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  const handleSignup = async (data: { email: string; password: string }) => {
    try {
      await signup(data.email, data.password);
      toast.success("Account created successfully!");
      onSignupClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Signup failed. Please try again.");
      }
    }
  };

  const handleSwitchToSignup = () => {
    onLoginClose();
    onSignupOpen();
  };

  const handleSwitchToLogin = () => {
    onSignupClose();
    onLoginOpen();
  };

  return (
    <>
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogTitle></DialogTitle>
        <DialogContent className="sm:max-w-[425px]">
          <LoginForm onSubmit={handleLogin} onSignupClick={handleSwitchToSignup} />
        </DialogContent>
      </Dialog>

      <Dialog open={isSignupOpen} onOpenChange={onSignupClose}>
        <DialogTitle></DialogTitle>
        <DialogContent className="sm:max-w-[425px]">
          <SignupForm onSubmit={handleSignup} onLoginClick={handleSwitchToLogin} />
        </DialogContent>
      </Dialog>
    </>
  );
} 