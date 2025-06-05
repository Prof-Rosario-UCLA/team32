import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { loginSchema } from "@/lib/validations/login-schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useState } from "react"
import { ForgotPasswordModal } from "./forgot-password-modal"

type LoginFormProps = {
  onSubmit: (data: { email: string; password: string }) => void;
  className?: string;
  onSignupClick?: () => void;
}

export function LoginForm({
  className,
  onSubmit,
  onSignupClick,
}: LoginFormProps) {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof loginSchema>) => {
    onSubmit({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <>
      <Form {...form}>
        <form 
          className={cn("flex flex-col gap-6", className)} 
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@g.ucla.edu"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm">
            <div className="mb-2">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onSignupClick}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Sign up
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </Form>

      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen} 
        onClose={() => setIsForgotPasswordOpen(false)} 
      />
    </>
  );
}
