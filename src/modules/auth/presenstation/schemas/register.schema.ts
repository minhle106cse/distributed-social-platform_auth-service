import z from "zod";

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const registerSchema = {
  body: registerBodySchema,
};