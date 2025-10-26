#!/usr/bin/env node
// scripts/add_points.js
// Usage (PowerShell):
// $env:SUPABASE_URL='https://xxxxx.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='service_role_key'; node scripts/add_points.js --user-id <USER_ID> --amount 10000

const https = require('https');
const http = require('http');
const url = require('url');

function getEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
  return v;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--user-id' || a === '-u') out.userId = args[i + 1], i++;
    else if (a === '--amount' || a === '-a') out.amount = parseInt(args[i + 1], 10), i++;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function request(method, path, body, headers = {}) {
  const SUPABASE_URL = getEnv('SUPABASE_URL');
  const svcKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  const parsed = url.parse(SUPABASE_URL);
  const isHttps = parsed.protocol === 'https:';
  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path,
    method,
    headers: {
      'apikey': svcKey,
      'Authorization': `Bearer ${svcKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...headers
    }
  };

  return new Promise((resolve, reject) => {
    const lib = isHttps ? https : http;
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        let parsedBody = null;
        try { parsedBody = data ? JSON.parse(data) : null; } catch (e) { parsedBody = data; }
        if (status && status >= 200 && status < 300) resolve({ status, body: parsedBody });
        else reject({ status, body: parsedBody });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const args = parseArgs();
  if (args.help || !args.userId || !args.amount) {
    console.log('Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars, then:');
    console.log('  node scripts/add_points.js --user-id <USER_ID> --amount <POINTS_TO_ADD>');
    process.exit(0);
  }

  const userId = args.userId;
  const add = args.amount;

  try {
    // 1) Get the user_points row for the user
    const resGet = await request('GET', `/rest/v1/user_points?user_id=eq.${userId}`);
    const rows = resGet.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('No user_points row found for user_id', userId, '-> creating one');
      const insertBody = { user_id: userId, points: add, total_earned: add };
      const resInsert = await request('POST', '/rest/v1/user_points', insertBody);
      console.log('Inserted row:', resInsert.body);
      process.exit(0);
    }

    const row = rows[0];
    const id = row.id;
    const current = Number(row.points || 0);
    const totalEarned = Number(row.total_earned || 0);
    const newPoints = current + add;
    const newTotal = totalEarned + add;

    // 2) Patch the row
    const patchBody = { points: newPoints, total_earned: newTotal };
    const resPatch = await request('PATCH', `/rest/v1/user_points?id=eq.${id}`, patchBody, { 'Prefer': 'return=representation' });
    console.log('Updated:', resPatch.body);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
