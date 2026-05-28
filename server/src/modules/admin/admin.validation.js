import { z } from 'zod';

const genderEnum = z.enum(['male', 'female', 'unisex', '']).optional();
const concentrationEnum = z.enum(['EDT', 'EDP', 'Parfum', 'Extrait', 'EDC', '']).optional();

const variantSchema = z.object({
  volume_ml: z.number().int().positive('Dung tích phải là số dương').optional().nullable(),
  volume_label: z.string().max(120).optional().nullable(),
  variant_type: z.string().max(80).optional().nullable(),
  price: z.number().positive('Giá variant phải là số dương'),
  sale_price: z.number().positive().optional().nullable(),
  stock_quantity: z.number().int().min(0, 'Tồn kho không được âm').default(0),
  image: z.string().max(1000).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
});

const imageSchema = z.object({
  image_url: z.string().min(1, 'URL ảnh không được để trống').max(1000),
  alt_text: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_thumbnail: z.boolean().default(false),
});

const scentNotesSchema = z.string().max(2000).optional().nullable();
const scentGroupSchema = z.string().max(120).optional().nullable();

function validateDiscountPrice(data, ctx) {
  if (
    data.discount_price !== undefined &&
    data.discount_price !== null &&
    data.price !== undefined &&
    data.discount_price >= data.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discount_price'],
      message: 'Giá khuyến mãi phải nhỏ hơn giá bán',
    });
  }
}

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Tên sản phẩm không được để trống').max(500),
  image: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, 'Giá sản phẩm không được âm'),
  id_category: z.number().int().positive('Danh mục không hợp lệ').optional().nullable(),
  id_brand: z.number().int().positive('Thương hiệu không hợp lệ').optional(),
  description: z.string().max(4000).optional().nullable(),
  scent_notes: scentNotesSchema,
  gender: genderEnum,
  concentration: concentrationEnum,
  volume_ml: z.number().int().positive('Dung tích phải là số dương').optional().nullable(),
  is_decant: z.boolean().default(false),
  discount_price: z.number().min(0, 'Giá khuyến mãi không được âm').optional().nullable(),
  stock: z.number().int().min(0, 'Tồn kho không được âm').default(0),
  status: z.boolean().default(true),
  sku: z.string().max(100).optional().nullable(),
  batch_code: z.string().max(120).optional().nullable(),
  scent_group: scentGroupSchema,
  variants: z.array(variantSchema).max(50).optional().default([]),
  images: z.array(imageSchema).max(20).optional().default([]),
}).superRefine(validateDiscountPrice);

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Tên sản phẩm không được để trống').max(500).optional(),
  image: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, 'Giá sản phẩm không được âm').optional(),
  id_category: z.number().int().positive('Danh mục không hợp lệ').optional().nullable(),
  id_brand: z.number().int().positive('Thương hiệu không hợp lệ').optional(),
  description: z.string().max(4000).optional().nullable(),
  scent_notes: scentNotesSchema,
  gender: genderEnum,
  concentration: concentrationEnum,
  volume_ml: z.number().int().positive('Dung tích phải là số dương').optional().nullable(),
  is_decant: z.boolean().optional(),
  discount_price: z.number().min(0, 'Giá khuyến mãi không được âm').optional().nullable(),
  stock: z.number().int().min(0, 'Tồn kho không được âm').optional(),
  status: z.boolean().optional(),
  sku: z.string().max(100).optional().nullable(),
  batch_code: z.string().max(120).optional().nullable(),
  scent_group: scentGroupSchema,
  variants: z.array(variantSchema).max(50).optional(),
  images: z.array(imageSchema).max(20).optional(),
}).superRefine(validateDiscountPrice);

export const statusProductSchema = z.object({
  status: z.boolean(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.number().int().positive('ID sản phẩm không hợp lệ'),
  variantId: z.number().int().positive().optional().nullable(),
  delta: z.number().int('Số lượng điều chỉnh phải là số nguyên'),
  reason: z.string().max(500).optional().nullable(),
});

export const bannerSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  imageUrl: z.string().min(1, 'URL ảnh không được để trống').max(1000),
  linkUrl: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const bannerUpdateSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  imageUrl: z.string().min(1).max(1000).optional(),
  linkUrl: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const bannerReorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1, 'Danh sách ID không được rỗng'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(['USER', 'STAFF', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'LOCKED', 'DISABLED']).optional(),
  address: z.string().max(1000).optional().nullable(),
  dob: z.string().optional().nullable(),
});

export const reviewBulkModerateSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Danh sách ID không được rỗng').max(200, 'Tối đa 200 đánh giá mỗi lần'),
  action: z.enum(['APPROVE', 'REJECT'], { errorMap: () => ({ message: 'Hành động phải là APPROVE hoặc REJECT' }) }),
});

export const resetStockSchema = z.object({
  stock: z.number().int().min(0, 'Tồn kho không được âm'),
});

export const dashboardSummaryQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD').optional(),
});

export const dashboardChartQuerySchema = z.object({
  type: z.enum(['revenue', 'orders', 'customers']).optional(),
  range: z.enum(['7d', '30d', '90d']).optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD').optional(),
});

export const decantOpenBottlesSchema = z.object({
  productId: z.number().int().positive('ID sản phẩm không hợp lệ'),
  quantity: z.number().int().positive('Số lượng chai cần mở phải là số dương'),
  reason: z.string().max(500).optional().nullable(),
});

export const decantRestockBottlesSchema = z.object({
  productId: z.number().int().positive('ID sản phẩm không hợp lệ'),
  quantity: z.number().int().positive('Số lượng chai nhập phải là số dương'),
  reason: z.string().max(500).optional().nullable(),
});

export const decantAdjustSchema = z.object({
  productId: z.number().int().positive('ID sản phẩm không hợp lệ'),
  sealedBottlesDelta: z.number().int('Số chai điều chỉnh phải là số nguyên'),
  openedMlDelta: z.number().int('Số ml điều chỉnh phải là số nguyên'),
  reason: z.string().max(500).optional().nullable(),
});
