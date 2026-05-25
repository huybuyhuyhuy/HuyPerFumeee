import { query } from '../config/database.js';

async function ensureBannersTable() {
  try {
    await query(`IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'banners')
      CREATE TABLE banners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255),
        subtitle NVARCHAR(500),
        image_url NVARCHAR(1000) NOT NULL,
        link_url NVARCHAR(1000),
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )`);
  } catch {
    // Silently ignore if table already exists or permission issue
  }
}

ensureBannersTable();

export async function listBanners({ includeInactive = false } = {}) {
  const whereActive = includeInactive ? '1=1' : 'is_active = 1';
  const rows = await query(
    `SELECT id, title, subtitle, image_url, link_url, sort_order, is_active, created_at, updated_at
     FROM banners WHERE ${whereActive}
     ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(mapBanner);
}

export async function getBannerById(id) {
  const rows = await query(
    `SELECT id, title, subtitle, image_url, link_url, sort_order, is_active, created_at, updated_at
     FROM banners WHERE id = ?`,
    [id]
  );
  return rows.length ? mapBanner(rows[0]) : null;
}

export async function createBanner({ title, subtitle, imageUrl, linkUrl, sortOrder, isActive }) {
  const result = await query(
    `INSERT INTO banners (title, subtitle, image_url, link_url, sort_order, is_active, created_at)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, GETDATE())`,
    [
      title || null,
      subtitle || null,
      imageUrl,
      linkUrl || null,
      sortOrder ?? 0,
      isActive !== false ? 1 : 0,
    ]
  );
  return { id: result[0]?.id };
}

export async function updateBanner(id, fields) {
  const existing = await query('SELECT TOP 1 id FROM banners WHERE id = ?', [id]);
  if (!existing.length) return null;

  const setClauses = [];
  const params = [];

  const fieldMap = {
    title: 'title',
    subtitle: 'subtitle',
    imageUrl: 'image_url',
    linkUrl: 'link_url',
    sortOrder: 'sort_order',
    isActive: 'is_active',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      if (key === 'isActive') {
        params.push(fields[key] ? 1 : 0);
      } else {
        params.push(fields[key]);
      }
    }
  }

  if (setClauses.length === 0) return { id, updated: false };

  setClauses.push('updated_at = GETDATE()');
  params.push(id);

  await query(
    `UPDATE banners SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  return { id, updated: true };
}

export async function deleteBanner(id) {
  const existing = await query('SELECT TOP 1 id FROM banners WHERE id = ?', [id]);
  if (!existing.length) return null;
  await query('DELETE FROM banners WHERE id = ?', [id]);
  return { id, deleted: true };
}

export async function reorderBanners(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await query('UPDATE banners SET sort_order = ?, updated_at = GETDATE() WHERE id = ?', [i, orderedIds[i]]);
  }
  return { reordered: orderedIds.length };
}

function mapBanner(row) {
  return {
    id: row.id,
    title: row.title || '',
    subtitle: row.subtitle || '',
    imageUrl: row.image_url,
    linkUrl: row.link_url || '',
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
