import z from "zod";

export const ConfirmPasswordResetSchema=z.object({
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number"),

    code:z.string().min(8),

    email:z.string().email()
})

export type  ConfirmPasswordResetSchema=z.infer<typeof ConfirmPasswordResetSchema>