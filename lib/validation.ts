import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  ),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Simplified registration schema for API (no confirmPassword or terms)
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  callbackURL: z.string().url().optional(),
  rememberMe: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  ),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Name too long"),
  description: z.string().optional(),
});

export const createEnvironmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").max(100, "Name too long").trim(),
  description: z.string().optional().transform(val => val?.trim()),
});

export const createVariableSchema = z.object({
  key: z.string()
    .min(1, "Key is required")
    .max(255, "Key too long")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Key must start with uppercase letter and contain only uppercase letters, numbers, and underscores"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
});

export const updateVariableSchema = z.object({
  value: z.string().min(1, "Value is required").optional(),
  description: z.string().optional(),
}).refine(data => data.value !== undefined || data.description !== undefined, {
  message: "At least one field must be provided",
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "DEVELOPER", "VIEWER"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type CreateVariableInput = z.infer<typeof createVariableSchema>;
export type UpdateVariableInput = z.infer<typeof updateVariableSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
