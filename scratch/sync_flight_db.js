const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function fix() {
  console.log('Fixing shipments table is_paused...');
  await client.execute({
    sql: "UPDATE shipments SET is_paused = 1, progress = 72 WHERE client_code = 'CLIENT-HUDSON' OR id = 'GOLD-2026-093901'",
    args: []
  });
  await client.execute({
    sql: "UPDATE shipment_telemetry SET is_paused = 1, progress = 72 WHERE shipment_id = 'GOLD-2026-093901'",
    args: []
  });

  const s = await client.execute("SELECT id, client_code, progress, is_paused, status FROM shipments WHERE client_code = 'CLIENT-HUDSON'");
  console.log('SHIPMENTS:', JSON.stringify(s.rows, null, 2));

  const t = await client.execute("SELECT * FROM shipment_telemetry WHERE shipment_id = 'GOLD-2026-093901'");
  console.log('TELEMETRY:', JSON.stringify(t.rows, null, 2));
}

fix();
