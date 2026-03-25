import z from "zod";
import { email } from "zod/v4";


 
export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: z
    .string()
    .email(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
})



export type RegisterUserSchema=z.infer<typeof registerUserSchema>

export const loginSchema = z.object({
  email: z
    .string()
    .min(5, "Email is too short")
    .max(100, "Email is too long")
    .email("Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    
});

export type LoginSchema=z.infer<typeof loginSchema>

export const EditUserSchema=z.object({
   name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces").optional(),
})

export type EditUserSchema=z.infer<typeof EditUserSchema>