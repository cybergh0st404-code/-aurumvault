const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });
async function run() {
  const s = await client.execute("SELECT id, client_code, progress, is_paused, status FROM shipments WHERE client_code = 'CLIENT-HUDSON' OR id LIKE '%93901%'");
  console.log('SHIPMENTS:', JSON.stringify(s.rows, null, 2));
  const t = await client.execute("SELECT * FROM shipment_telemetry WHERE shipment_id LIKE '%93901%'");
  console.log('TELEMETRY:', JSON.stringify(t.rows, null, 2));
}
run();
