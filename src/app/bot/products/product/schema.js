import * as z from 'zod'; // Подключаем zod

export const SubproductSchema = z
  .object({
    name: z.string().min(1, 'Название должно содержать минимум 1 символ'),
    warehouse: z.boolean(),
    frozen: z.boolean(),
    price: z.preprocess(
      (val) => {
        // Если передана пустая строка, превращаем в 0
        if (val === '') return 0;
        return Number(val);
      },
      z.number().min(0.01, 'Цена должна быть больше 0.01'),
    ),
    // Здесь убираем проверки через .refine, оставляем только типизацию
    warehouse_count: z.preprocess((val) => {
      // Если val пустая строка — делаем ноль или null (на ваше усмотрение)
      if (val === '') return 0;
      return Number(val);
    }, z.number().nullable()),
  })
  .superRefine((data, ctx) => {
    // Если склад включён, то warehouse_count должен быть числом больше 0
    if (data.warehouse) {
      if (data.warehouse_count === null || data.warehouse_count <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['warehouse_count'],
          message: 'Укажите количество на складе',
        });
      }
    }
  });

// Базовая схема для любого товара
const BaseProductSchema = z.object({
  name: z.string().min(3, 'Название должно быть минимум 3 символа'),
  price: z.preprocess(
    (val) => {
      // Если передана пустая строка, превращаем в 0
      if (val === '') return 0;
      return Number(val);
    },
    z.number().min(0.01, 'Цена должна быть больше 0.01'),
  ),
  image: z.string().nonempty('Загрузите изображение'),
  category: z.string().nullable().optional(),
  frozen: z.boolean(),
  description: z.string().nullable().optional(),
  warehouse: z.boolean(),
  // Здесь оставляем типизацию – конкретную проверку делаем в superRefine продукта
  warehouse_count: z.preprocess((val) => {
    // Если val пустая строка — делаем ноль или null (на ваше усмотрение)
    if (val === '') return 0;
    return Number(val);
  }, z.number().nullable().optional()),
  grouped: z.boolean().default(false),
  // Подтовары – опционально, так как для простого товара их быть не должно
  subproducts: z.array(SubproductSchema).optional(),
});

// Схема продукта с проверками на уровне всего объекта
export const ProductSchema = BaseProductSchema.superRefine((data, ctx) => {
  if (data.grouped) {
    // Для сгруппированного товара:
    // - Обязательно должен быть хотя бы один подтовар
    if (!data.subproducts || data.subproducts.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['global'],
        message: 'У сгруппированного товара должен быть хотя бы один подтовар',
      });
    }
    // - Поле warehouse_count должно быть выключено (т.е. null или undefined)
    if (data.warehouse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warehouse_count'],
        message: 'Склад должен быть выключен у сгруппированного товара',
      });
    }
  } else {
    // Для простого товара:
    // - Подтовары недопустимы
    if (data.subproducts && data.subproducts.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['global'],
        message: 'Простой товар не может иметь подтовары',
      });
    }
    // - Если склад включён, warehouse_count обязателен и должен быть > 0
    if (data.warehouse && (data.warehouse_count === null || data.warehouse_count <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warehouse_count'],
        message: 'Укажите количество товара на складе',
      });
    }
  }
});
