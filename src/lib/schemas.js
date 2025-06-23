import { z } from 'zod';

// Схема для валидации новости
export const mailingSchema = z.object({
  title: z
    .string()
    .min(1, 'Заголовок обязателен')
    .max(255, 'Заголовок не должен превышать 255 символов')
    .trim(),
  content: z
    .object({
      html: z.string().optional(),
      text: z.string().optional(),
    })
    .optional()
    .default({
      html: '',
      text: '',
    }),
  image: z.string().optional().default(''),
  is_active: z.boolean().default(false),
});

// Схема для создания новости
export const createMailingSchema = mailingSchema;

// Схема для обновления новости
export const updateMailingSchema = mailingSchema.partial();
