import * as z from "zod"

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid UCLA email").refine(
    (email) => email.endsWith("@g.ucla.edu"),
    "Please use your UCLA email"
  ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});