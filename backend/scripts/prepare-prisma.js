const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('schema.prisma not found at:', schemaPath);
  process.exit(0);
}

let schema = fs.readFileSync(schemaPath, 'utf8');
const dbUrl = process.env.DATABASE_URL || '';
const isProd = process.env.NODE_ENV === 'production';

const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://') || isProd;

if (isPostgres) {
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma] Configured datasource provider to "postgresql".');
  }
  // Ensure DATABASE_URL is valid for Prisma client generation if not yet set in build environment
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = 'postgresql://roadguard_user:postgres@localhost:5432/roadguard_ai';
  }
} else if (dbUrl.startsWith('file:') || !dbUrl) {
  if (schema.includes('provider = "postgresql"')) {
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma] Configured datasource provider to "sqlite".');
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}
