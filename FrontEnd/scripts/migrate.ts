/**
 * One-command setup: run migrations and seed users.
 * 1. Run migrations/002_users.sql
 * 2. Run seed-users
 * 3. Run migrations/003_super_admin.sql
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  // Try from FrontEnd folder - migrations might be at repo root
  const alt = path.join(process.cwd(), 'migrations');
  if (fs.existsSync(alt)) {
    // We're in scripts/, migrations is ../migrations from FrontEnd = ../../migrations from scripts
    // Actually cwd when running tsx scripts/migrate.ts is FrontEnd
    // So migrations could be at ../migrations (repo root)
  }
}

async function runSqlFile(pool: pg.Pool, filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  await pool.query(sql);
  console.log(`Ran ${path.basename(filePath)}`);
}

async function main() {
  const pool = new pg.Pool({ connectionString });

  try {
    // migrations/ is at repo root (sibling of FrontEnd)
    const repoRoot = path.resolve(process.cwd(), '..');
    const m002 = path.join(repoRoot, 'migrations', '002_users.sql');
    const m003 = path.join(repoRoot, 'migrations', '003_super_admin.sql');

    if (!fs.existsSync(m002)) {
      console.error('migrations/002_users.sql not found. Expected at:', m002);
      process.exit(1);
    }

    await runSqlFile(pool, m002);

    // Seed users (inline to avoid spawning)
    const { execSync } = await import('child_process');
    execSync('npx tsx scripts/seed-users.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: connectionString },
    });

    if (fs.existsSync(m003)) {
      await runSqlFile(pool, m003);
    }

    const m004 = path.join(repoRoot, 'migrations', '004_force_initial_password_change.sql');
    if (fs.existsSync(m004)) {
      await runSqlFile(pool, m004);
    }

    console.log('Migration complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
