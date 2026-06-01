import { query } from '../../config/database.js';

let authCapabilitiesPromise = null;

function columnSet(rows) {
  return new Set(rows.map((row) => String(row.COLUMN_NAME || row.column_name || '').toLowerCase()));
}

function tableSet(rows) {
  return new Set(rows.map((row) => String(row.TABLE_NAME || row.table_name || '').toLowerCase()));
}

async function columns(tableName) {
  return query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?`,
    [tableName]
  );
}

export async function getAuthStorageCapabilities() {
  if (!authCapabilitiesPromise) {
    authCapabilitiesPromise = (async () => {
      const [tables, userColumns] = await Promise.all([
        query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = 'dbo'
            AND TABLE_NAME IN (
              'refresh_tokens',
              'password_reset_tokens',
              'email_verification_tokens',
              'login_attempts',
              'user_addresses',
              'social_accounts'
            )
        `),
        columns('users'),
      ]);
      const tablesAvailable = tableSet(tables);
      return {
        userColumns: columnSet(userColumns),
        hasRefreshTokens: tablesAvailable.has('refresh_tokens'),
        hasPasswordResetTokens: tablesAvailable.has('password_reset_tokens'),
        hasEmailVerificationTokens: tablesAvailable.has('email_verification_tokens'),
        hasLoginAttempts: tablesAvailable.has('login_attempts'),
        hasUserAddresses: tablesAvailable.has('user_addresses'),
        hasSocialAccounts: tablesAvailable.has('social_accounts'),
      };
    })();
  }

  return authCapabilitiesPromise;
}

export function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

export function resetAuthStorageCapabilitiesForTests() {
  authCapabilitiesPromise = null;
}
