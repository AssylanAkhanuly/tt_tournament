import { z } from "zod";

/** Kazakh/Russian mobile number — strips spaces/dashes, checks 11-digit +7 format */
const phoneSchema = z
  .string()
  .min(1, "Введите номер телефона")
  .transform((val) => val.replace(/[\s\-()]/g, ""))
  .refine(
    (val) =>
      /^\+?7\d{10}$/.test(val) ||   // +7XXXXXXXXXX or 7XXXXXXXXXX
      /^8\d{10}$/.test(val),          // 8XXXXXXXXXX (Russian local)
    { message: "Введите корректный номер (+7 XXX XXX XX XX)" }
  );

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(150, "Имя слишком длинное"),
  phone: phoneSchema,
  pin: z
    .string()
    .length(6, "PIN-код должен содержать ровно 6 цифр")
    .regex(/^\d{6}$/, "PIN-код должен состоять только из цифр"),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  pin: z
    .string()
    .length(6, "Введите 6-значный PIN-код")
    .regex(/^\d{6}$/, "PIN-код должен состоять только из цифр"),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
