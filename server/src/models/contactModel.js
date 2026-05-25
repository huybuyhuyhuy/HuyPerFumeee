import { query } from '../config/database.js';

let tableReady = false;

async function ensureContactMessagesTable() {
  if (tableReady) return;

  await query(`
    IF OBJECT_ID('dbo.contact_messages', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.contact_messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(120) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        email NVARCHAR(160) NULL,
        need NVARCHAR(120) NULL,
        message NVARCHAR(1000) NULL,
        status NVARCHAR(30) NOT NULL DEFAULT N'New',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    END
  `);

  tableReady = true;
}

export async function createContactMessage(payload) {
  await ensureContactMessagesTable();

  const rows = await query(
    `INSERT INTO contact_messages (name, phone, email, need, message)
     OUTPUT INSERTED.id, INSERTED.created_at
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.phone,
      payload.email || null,
      payload.need || null,
      payload.message || null,
    ]
  );

  return {
    id: rows[0]?.id,
    createdAt: rows[0]?.created_at,
  };
}
