import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

type Check = {
  name: string;
  ok: boolean;
  details?: Record<string, unknown>;
  error?: string;
  duration_ms?: number;
};

type Report = {
  ok: boolean;
  service: "adminer";
  time_utc: string;
  node_version: string;
  git_sha?: string;
  uptime_s: number;
  checks: Check[];
};

const REQUIRED_ENVS = [
  "DATABASE_URL",
  "DODO_WEBHOOK_SECRET",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "BILLING_ENABLED",
];

function redact(v: string | undefined) {
  if (!v) return "MISSING";
  if (v.length <= 8) return "***";
  return v.slice(0, 4) + "…" + v.slice(-4);
}

async function withTimer<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: string; ms: number }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { result, ms: Date.now() - t0 };
  } catch (e: any) {
    return { error: e?.message || String(e), ms: Date.now() - t0 };
  }
}

function baseUrlFrom(req: NextApiRequest) {
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Report | { error: string }>) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const allowUnAuth = process.env.ALLOW_UNAUTH_DEV === "true";
  const checks: Check[] = [];

  // 1) Env
  const envCheck = await withTimer(async () => {
    const present: Record<string, string> = {};
    for (const k of REQUIRED_ENVS) present[k] = redact(process.env[k]);
    // Optional
    present["LOG_LEVEL"] = redact(process.env.LOG_LEVEL);
    present["NEXT_RUNTIME_LOG"] = redact(process.env.NEXT_RUNTIME_LOG);
    present["ALLOW_UNAUTH_DEV"] = process.env.ALLOW_UNAUTH_DEV ?? "unset";
    return present;
  });
  
  // Check only required env vars for the 'ok' status
  const requiredEnvOk = REQUIRED_ENVS.every(k => process.env[k] && process.env[k] !== "MISSING");
  
  checks.push({
    name: "env",
    ok: requiredEnvOk,
    details: envCheck.result,
    error: envCheck.error,
    duration_ms: envCheck.ms,
  });

  // Shared pool helper
  const dbUrl = process.env.DATABASE_URL;
  async function withPool<T>(fn: (pool: Pool) => Promise<T>) {
    if (!dbUrl) throw new Error("DATABASE_URL missing");
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      return await fn(pool);
    } finally {
      await pool.end();
    }
  }

  // 2) DB baseline
  const dbCheck = await withTimer(async () =>
    withPool(async (pool) => {
      const r1 = await pool.query<{ now: string; version: string }>(
        "select now()::text as now, version() as version"
      );
      const r2 = await pool.query(
        "select to_regclass('public.orgs') as orgs, to_regclass('public.jobs') as jobs, to_regclass('public.billing_audit') as billing_audit, to_regclass('public.webhook_events') as webhook_events"
      );
      const r3 = await pool.query("select count(*)::int as n from orgs");
      return {
        now: r1.rows[0].now,
        pg_version: r1.rows[0].version.split(' ').slice(0, 2).join(' '),
        tables: {
          orgs: r2.rows[0].orgs !== null,
          jobs: r2.rows[0].jobs !== null,
          billing_audit: r2.rows[0].billing_audit !== null,
          webhook_events: r2.rows[0].webhook_events !== null,
        },
        orgs_count: r3.rows[0].n,
      };
    })
  );
  checks.push({
    name: "db",
    ok: !dbCheck.error && (dbCheck.result as any)?.tables?.orgs === true,
    details: dbCheck.result,
    error: dbCheck.error,
    duration_ms: dbCheck.ms,
  });

  // 3) Inngest framework route
  const inngestCheck = await withTimer(async () => {
    const url = `${baseUrlFrom(req)}/api/inngest`;
    const r = await fetch(url, { method: "GET" });
    const text = await r.text();
    return { url, status: r.status, preview: text.slice(0, 120) };
  });
  checks.push({
    name: "inngest_framework",
    ok: !inngestCheck.error && (inngestCheck.result as any)?.status === 200,
    details: inngestCheck.result,
    error: inngestCheck.error,
    duration_ms: inngestCheck.ms,
  });

  // 4) Scripts present
  const scriptsCheck = await withTimer(async () => {
    const apiDir = process.cwd(); // We're already in the API directory
    const repoRoot = path.join(process.cwd(), "..", ".."); // project root
    const files = [
      path.join(apiDir, "scripts/2025-01-22_billing.sql"),
      path.join(apiDir, "scripts/create-tables.sql"),
      path.join(apiDir, "scripts/2025-08-22_add_current_period_end.sql"),
      path.join(apiDir, "scripts/2025-08-22_billing_audit.sql"),
      path.join(apiDir, "scripts/smoke/sql/2025-08-22_smoke_seed.sql"),
      path.join(apiDir, "scripts/smoke/sql/2025-08-22_smoke_verify_before.sql"),
      path.join(apiDir, "scripts/smoke/sql/2025-08-22_smoke_verify_after.sql"),
      path.join(repoRoot, "scripts/smoke/adminer_smoke.sh"),
      path.join(repoRoot, "scripts/smoke/preflight_check_simple.sh"),
    ];
    const status = Object.fromEntries(files.map(f => [f.replace(repoRoot + path.sep, ""), fs.existsSync(f)]));
    return status;
  });
  checks.push({
    name: "scripts",
    ok: Object.values(scriptsCheck.result || {}).every(Boolean),
    details: scriptsCheck.result,
    error: scriptsCheck.error,
    duration_ms: scriptsCheck.ms,
  });

  // 5) Cron doc (static)
  const cronCheck = await withTimer(async () => ({
    schedule_documented: "30 21 * * *",
    timezone_note: "Cron is UTC unless set otherwise. 21:30 UTC = 03:00 IST (+1 day).",
  }));
  checks.push({ name: "cron_doc", ok: true, details: cronCheck.result, duration_ms: cronCheck.ms });

  // 6) Dev bypass visibility
  checks.push({ name: "dev_bypass", ok: true, details: { ALLOW_UNAUTH_DEV: allowUnAuth } });

  // 7) NEW — Dry‑run candidates (uses canonical view)
  const candidatesCheck = await withTimer(async () =>
    withPool(async (pool) => {
      // Use the canonical view for consistency
      const r = await pool.query<{ n: number }>("select count(*)::int as n from billing_downgrade_candidates");
      // sample a few, for visibility (redacted fields only)
      const sample = await pool.query(`
        select id, name, plan, billing_status
        from billing_downgrade_candidates
        order by name
        limit 5
      `);
      return { count: r.rows[0].n, sample: sample.rows };
    })
  );
  checks.push({
    name: "dry_run_candidates",
    ok: !candidatesCheck.error,
    details: candidatesCheck.result,
    error: candidatesCheck.error,
    duration_ms: candidatesCheck.ms,
  });

  // 8) NEW — Billing audit (recent)
  const auditCheck = await withTimer(async () =>
    withPool(async (pool) => {
      // If table missing, return graceful result
      const exists = await pool.query("select to_regclass('public.billing_audit') is not null as exists");
      const present = exists.rows[0]?.exists === true;
      if (!present) {
        return { present: false, last_24h: 0, last_7d: 0, recent: [] as any[] };
      }
      const last24 = await pool.query<{ n: number }>(
        "select count(*)::int as n from billing_audit where occurred_at >= now() - interval '24 hours'"
      );
      const last7 = await pool.query<{ n: number }>(
        "select count(*)::int as n from billing_audit where occurred_at >= now() - interval '7 days'"
      );
      const recent = await pool.query(`
        select occurred_at, org_id, org_slug, previous_plan, new_plan, reason, dry_run
        from billing_audit
        order by occurred_at desc
        limit 10
      `);
      return {
        present: true,
        last_24h: last24.rows[0].n,
        last_7d: last7.rows[0].n,
        recent: recent.rows,
      };
    })
  );
  checks.push({
    name: "billing_audit_recent",
    ok: !auditCheck.error,
    details: auditCheck.result,
    error: auditCheck.error,
    duration_ms: auditCheck.ms,
  });

  // 9) NEW — Dodo/Webhook "soft" health (internal only)
  const dodoCheck = await withTimer(async () =>
    withPool(async (pool) => {
      const secretPresent = !!process.env.DODO_WEBHOOK_SECRET;
      const exists = await pool.query("select to_regclass('public.webhook_events') is not null as exists");
      const haveTable = exists.rows[0]?.exists === true;
      let last: any = null;
      if (haveTable) {
        const r = await pool.query(`
          select id, event_type, org_id, received_at
          from webhook_events
          where event_type like '%dodo%' or event_type like '%subscription%'
          order by received_at desc
          limit 1
        `);
        last = r.rows[0] || null;
      }
      return {
        webhook_secret_present: secretPresent,
        webhook_table_present: haveTable,
        last_event: last,
      };
    })
  );
  checks.push({
    name: "dodo_health",
    ok: !dodoCheck.error && (dodoCheck.result as any)?.webhook_secret_present === true,
    details: dodoCheck.result,
    error: dodoCheck.error,
    duration_ms: dodoCheck.ms,
  });

  const report: Report = {
    ok: checks.every(c => c.ok),
    service: "adminer",
    time_utc: new Date().toISOString(),
    node_version: process.version,
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || undefined,
    uptime_s: Math.round(process.uptime()),
    checks,
  };

  res.setHeader("Cache-Control", "no-store");
  return res.status(report.ok ? 200 : 503).json(report);
} 