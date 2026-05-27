import { z } from "zod";

/**
 * International phone — must start with a + and a dial code,
 * followed by 7-12 digits. PhoneInput always composes "+<code><digits>".
 */
const phoneSchema = z
  .string()
  .min(1, "Введите номер телефона")
  .transform((val) => val.replace(/[\s\-()]/g, ""))
  .refine(
    (val) => /^\+\d{7,15}$/.test(val),
    { message: "Введите корректный номер телефона" }
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
