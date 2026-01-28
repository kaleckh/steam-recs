/**
 * Fast bulk sync using single UPDATE statements per batch
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

const localPrisma = new PrismaClient({ log: ['error'] });
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://postgres:hammkal000.@db.kirzojwgulrxazfckdgo.supabase.co:6543/postgres?pgbouncer=true&statement_cache_size=0',
    },
  },
  log: ['error'],
});

async function main() {
  console.log('='.repeat(60));
  console.log('FAST BULK SYNC - Single UPDATE per batch');
  console.log('='.repeat(60));

  try {
    // Get games with media from local
    console.log('\nFetching local games with media...');
    const localGames = await localPrisma.$queryRaw<Array<{ app_id: bigint; metadata: any }>>`
      SELECT app_id, metadata FROM games
      WHERE metadata->'screenshots' IS NOT NULL
        AND jsonb_array_length(metadata->'screenshots') > 0
    `;
    const localMap = new Map(localGames.map(g => [g.app_id.toString(), g.metadata]));
    console.log(`Found ${localGames.length} with media locally`);

    // Get missing in prod
    console.log('\nFetching prod games missing media...');
    const prodMissing = await prodPrisma.$queryRaw<Array<{ app_id: bigint; metadata: any }>>`
      SELECT app_id, metadata FROM games
      WHERE metadata->'screenshots' IS NULL
         OR jsonb_array_length(COALESCE(metadata->'screenshots', '[]'::jsonb)) = 0
    `;
    console.log(`Found ${prodMissing.length} missing in prod`);

    // Filter to syncable
    const toSync = prodMissing.filter(g => localMap.has(g.app_id.toString()));
    console.log(`\n${toSync.length} games to sync\n`);

    if (toSync.length === 0) return;

    // Process in large batches using VALUES + UPDATE FROM
    const batchSize = 500;
    let updated = 0;

    for (let i = 0; i < toSync.length; i += batchSize) {
      const batch = toSync.slice(i, i + batchSize);

      // Build VALUES clause
      const values = batch.map(g => {
        const local = localMap.get(g.app_id.toString());
        const merged = {
          ...(g.metadata || {}),
          header_image: local.header_image,
          screenshots: local.screenshots,
          movies: local.movies,
          background: local.background,
          background_raw: local.background_raw,
          capsule_image: local.capsule_image,
          capsule_imagev5: local.capsule_imagev5,
        };
        // Escape single quotes in JSON
        const jsonStr = JSON.stringify(merged).replace(/'/g, "''");
        return `(${g.app_id}, '${jsonStr}'::jsonb)`;
      }).join(',\n');

      const sql = `
        UPDATE games AS g
        SET metadata = v.new_metadata, updated_at = NOW()
        FROM (VALUES ${values}) AS v(app_id, new_metadata)
        WHERE g.app_id = v.app_id
      `;

      await prodPrisma.$executeRawUnsafe(sql);
      updated += batch.length;
      console.log(`Progress: ${updated}/${toSync.length}`);
    }

    console.log(`\nDONE: Updated ${updated} games`);
  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

main().catch(console.error);
