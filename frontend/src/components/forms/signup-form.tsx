import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signupSchema } from "../../lib/validations/signup-schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form"
import { type SignupFormProps } from "../../types/forms"

export function SignupForm({
  className,
  onSubmit,
  onLoginClick,
}: SignupFormProps) {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof signupSchema>) => {
    onSubmit({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Form {...form}>
      <form 
        className={cn("flex flex-col gap-6", className)} 
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Enter your UCLA email to create your account
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
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
              Sign up
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </button>
        </div>
      </form>
    </Form>
  );
}
