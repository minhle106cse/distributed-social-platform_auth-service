import z from 'zod'

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginBody = z.infer<typeof loginBodySchema>

export const loginSchema = z.object({
  body: loginBodySchema,
})
