/* eslint-disable */
// @ts-nocheck
/**
 * Script to fetch battle data directly from database.
 * Usage: npx ts-node scripts/get-battle.ts <battleId>
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const battleId = process.argv[2] || 'dc6a7f65-ecea-4806-9707-8228077e4944';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env['DATABASE_URL'],
    entities: [],
    synchronize: false,
  });

  await dataSource.initialize();

  // First, list all tables
  const tables = await dataSource.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log('=== TABLES IN DATABASE ===');
  tables.forEach(t => console.log('-', t.table_name));

  // Try to find battle table with different naming
  const battleTable = tables.find(t => 
    t.table_name.toLowerCase().includes('battle')
  );

  if (battleTable) {
    console.log('\n=== BATTLE TABLE STRUCTURE ===');
    const columns = await dataSource.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
      [battleTable.table_name]
    );
    columns.forEach(c => console.log(`- ${c.column_name}: ${c.data_type}`));

    console.log('\n=== FETCHING BATTLE ===');
    const result = await dataSource.query(
      `SELECT * FROM ${battleTable.table_name} WHERE id = $1`,
      [battleId]
    );

    if (result.length === 0) {
      console.log('Battle not found:', battleId);
      
      // Show recent battles
      const recent = await dataSource.query(
        `SELECT id, winner, rounds FROM ${battleTable.table_name} ORDER BY created_at DESC LIMIT 5`
      );
      console.log('\nRecent battles:');
      recent.forEach(b => console.log(`- ${b.id} | winner: ${b.winner} | rounds: ${b.rounds}`));
    } else {
      const battle = result[0];
      console.log('ID:', battle.id);
      console.log('Winner:', battle.winner);
      console.log('Rounds:', battle.rounds);
      console.log('\n=== EVENTS ===');
      const events = battle.events || [];
      console.log('Total events:', events.length);
      events.slice(0, 50).forEach((event, i) => {
        console.log(`[${i}] R${event.round} | ${event.type} | ${event.actorId} -> ${event.targetId || '-'}`);
        if (event.damage) console.log(`    dmg: ${event.damage}`);
        if (event.metadata) console.log(`    meta:`, JSON.stringify(event.metadata));
      });
      if (events.length > 50) {
        console.log(`... and ${events.length - 50} more events`);
      }
    }
  } else {
    console.log('\nNo battle table found!');
  }

  await dataSource.destroy();
}

main().catch(console.error);
