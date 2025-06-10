import { z } from "zod"
export const emailSchema = z.object({ email: z.string().email("Invalid email") });
export const codeSchema = z.object({ code: z.string().length(6, "Code must be 6 digits") });
export const passwordSchema = z.object({ password: z.string().min(6, "Password must be at least 6 characters") });

