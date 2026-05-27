import z from "zod";

const refreshBodySchema = z.object({
    refreshToken: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
});

export type RefreshBody = z.infer<typeof refreshBodySchema>;

export const refreshSchema = {
  body: refreshBodySchema,
};