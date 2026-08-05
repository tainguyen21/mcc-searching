import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { mccCodes } from '../src/infrastructure/database/schema';

const catalog = [
  ['5411', 'Grocery Stores, Supermarkets', 'Siêu thị', 'retail', 'Bán lẻ'],
  ['5541', 'Service Stations', 'Trạm xăng', 'transport', 'Vận tải'],
  ['5812', 'Eating Places and Restaurants', 'Nhà hàng', 'dining', 'Ăn uống'],
  ['5814', 'Fast Food Restaurants', 'Nhà hàng thức ăn nhanh', 'dining', 'Ăn uống'],
  ['5999', 'Miscellaneous and Specialty Retail Stores', 'Cửa hàng chuyên dụng', 'retail', 'Bán lẻ'],
] as const;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const database = drizzle(pool);

await database
  .insert(mccCodes)
  .values(
    catalog.map(([code, englishName, vietnameseName, categoryId, categoryName]) => ({
      code,
      englishName,
      vietnameseName,
      categoryId,
      categoryName,
    })),
  )
  .onConflictDoNothing();

console.log(`MCC seed complete: ${catalog.length} catalog rows considered.`);
await pool.end();
