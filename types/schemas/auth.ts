import { z } from "zod";

export const PASSWORD_RULE = "Kata sandi minimal 8 karakter, 1 huruf, dan 1 angka";

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_RULE)
  .max(128, PASSWORD_RULE)
  .regex(/[A-Za-z]/, PASSWORD_RULE)
  .regex(/\d/, PASSWORD_RULE);

export const phoneSchema = z
  .string()
  .regex(/^08\d{8,11}$/, "Nomor telepon harus diawali 08 dan 10 sampai 13 digit");

export const whatsappNumberSchema = z
  .string()
  .regex(/^62\d{8,13}$/, "Nomor WhatsApp harus format E.164 tanpa tanda plus, contoh 6281234567890");

export const driverProfileSchema = z
  .strictObject({
    vehicleType: z.string().min(1, "Jenis kendaraan wajib diisi").max(50),
    vehiclePlate: z.string().max(20).optional(),
    whatsappNumber: whatsappNumberSchema,
  });

export const registerSchema = z
  .strictObject({
    name: z.string().min(2, "Nama minimal 2 karakter").max(100),
    email: z.string().email("Format email tidak valid"),
    password: passwordSchema,
    phone: phoneSchema,
    role: z.enum(["CUSTOMER", "DRIVER"]),
    driver: driverProfileSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "DRIVER" && !value.driver) {
      ctx.addIssue({
        code: "custom",
        path: ["driver"],
        message: "Data driver wajib diisi untuk peran DRIVER",
      });
    }
    if (value.role === "CUSTOMER" && value.driver) {
      ctx.addIssue({
        code: "custom",
        path: ["driver"],
        message: "Data driver tidak boleh diisi untuk peran CUSTOMER",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
