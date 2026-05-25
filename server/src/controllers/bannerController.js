import { successResponse, errorResponse } from '../utils/response.js';
import {
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from '../models/bannerModel.js';
import { bannerSchema, bannerUpdateSchema, bannerReorderSchema } from '../modules/admin/admin.validation.js';
import { auditLog } from '../config/logger.js';

// Public endpoint — returns active banners only
export async function publicList(_req, res) {
  try {
    const banners = await listBanners({ includeInactive: false });
    return successResponse(res, 'Lấy danh sách banners thành công', banners);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách banners', { message: err.message });
  }
}

// Admin — returns all banners
export async function adminList(_req, res) {
  try {
    const banners = await listBanners({ includeInactive: true });
    return successResponse(res, 'Lấy danh sách banners thành công', banners);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách banners', { message: err.message });
  }
}

export async function create(req, res) {
  try {
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const result = await createBanner(parsed.data);
    auditLog('BANNER_CREATE', req.user?.id, { bannerId: result.id });
    return successResponse(res, 'Tạo banner thành công', result, 201);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi tạo banner', { message: err.message });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID banner không hợp lệ');

    const parsed = bannerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const result = await updateBanner(id, parsed.data);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy banner');

    auditLog('BANNER_UPDATE', req.user?.id, { bannerId: id });
    return successResponse(res, 'Cập nhật banner thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật banner', { message: err.message });
  }
}

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID banner không hợp lệ');

    const result = await deleteBanner(id);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy banner');

    auditLog('BANNER_DELETE', req.user?.id, { bannerId: id });
    return successResponse(res, 'Xóa banner thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi xóa banner', { message: err.message });
  }
}

export async function reorder(req, res) {
  try {
    const parsed = bannerReorderSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', {
        fields: { orderedIds: [parsed.error.issues[0]?.message || 'Danh sách ID không hợp lệ'] },
      });
    }

    const result = await reorderBanners(parsed.data.orderedIds);
    auditLog('BANNER_REORDER', req.user?.id, { count: result.reordered });
    return successResponse(res, 'Sắp xếp lại banners thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi sắp xếp banners', { message: err.message });
  }
}
