import 'dotenv/config';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  merchantLocations,
  merchants,
} from '../src/infrastructure/database/schema';

const csvPath = process.argv[2];
if (!csvPath) {
  throw new Error(
    'Usage: pnpm --filter api seed:locations -- <path-to-locations.csv>',
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const database = drizzle(pool);
const rows = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });
let imported = 0;
let rejected = 0;
let lineNumber = 0;

for await (const line of rows) {
  lineNumber += 1;
  if (lineNumber === 1) {
    if (line !== 'merchant_name,address,province,latitude,longitude') {
      throw new Error('CSV header must be merchant_name,address,province,latitude,longitude');
    }
    continue;
  }
  const [merchantName, address, province, latitudeText, longitudeText] = line.split(',');
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (
    !merchantName ||
    !address ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    rejected += 1;
    continue;
  }
  const normalizedName = normalize(merchantName);
  const normalizedAddress = normalize(address);
  const [merchant] = await database
    .insert(merchants)
    .values({
      canonicalName: merchantName,
      normalizedName,
      storeSlug: slug(normalizedName),
    })
    .onConflictDoUpdate({
      target: merchants.normalizedName,
      set: { updatedAt: new Date() },
    })
    .returning({ id: merchants.id });
  const [existing] = await database
    .select({ id: merchantLocations.id })
    .from(merchantLocations)
    .where(
      sql`${merchantLocations.merchantId} = ${merchant.id}
        AND ${merchantLocations.normalizedAddress} = ${normalizedAddress}`,
    )
    .limit(1);
  if (!existing) {
    await database.insert(merchantLocations).values({
      merchantId: merchant.id,
      address,
      normalizedAddress,
      province: province || undefined,
      geo: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`,
    });
  }
  imported += 1;
}

console.log(`Location import complete: imported=${imported} rejected=${rejected}`);
await pool.end();

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('vi').replace(/\s+/g, ' ');
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gu, 'd')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 220);
}
