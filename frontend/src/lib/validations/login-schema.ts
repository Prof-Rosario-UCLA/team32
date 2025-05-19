import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid UCLA email").refine(
    (email) => email.endsWith("@g.ucla.edu"),
    "Please use your UCLA email"
  ),
  password: z.string().min(1, "Password is required"),
})