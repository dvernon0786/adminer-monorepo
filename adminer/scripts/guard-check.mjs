#!/usr/bin/env node
import http from "node:http";
import https from "node:https";
import { setTimeout as delay } from "node:timers/promises";

const AGENT = new http.Agent({ keepAlive: true, maxSockets: 4 });
const S = (url) => (url.startsWith("https") ? https : http);

async function head(url) {
  return new Promise((resolve, reject) => {
    const req = S(url).request(url, { method: "GET", agent: AGENT }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function assert(cond, msg) {
  if (!cond) {
    console.error("❌", msg);
    process.exit(1);
  }
}

(async () => {
  const base = process.env.BASE_URL || "http://localhost:3000";

  // 1) SPA root should be 200, set cookie "sg"
  {
    // Accept 200 or 204 on first paint and retry cookie a couple times
    let res = await head(base + "/");
    assert([200, 204].includes(res.status), `"/" expected 200/204, got ${res.status}`);

    let cookieOk = false;
    for (let i = 0; i < 3 && !cookieOk; i++) {
      const setCookie = (res.headers["set-cookie"] || []).join("; ");
      cookieOk = setCookie.includes("sg=") || (res.headers["cookie"] || "").includes("sg=");
      if (!cookieOk) {
        await delay(150);
        res = await head(base + "/");
      }
    }
    assert(cookieOk, "root did not set sg cookie");
    console.log("✅ / ok; sg cookie present");
  }

  // 2) dashboard should be 200 (no server 3xx); content is SPA HTML
  {
    const res = await head(base + "/dashboard");
    assert(res.status === 200, `"/dashboard" expected 200, got ${res.status}`);
    assert(
      (res.headers["content-type"] || "").includes("text/html"),
      "dashboard did not serve HTML"
    );
    console.log("✅ /dashboard ok; served HTML, no server redirect");
  }

  // 3) API health should be 200 without auth
  {
    const res = await head(base + "/api/consolidated?action=health");
    assert(res.status === 200, `health expected 200, got ${res.status}`);
    console.log("✅ /api/consolidated?action=health ok");
  }

  // 4) API protected route should be 401 JSON when signed out (no 3xx)
  {
    const res = await head(base + "/api/consolidated?action=quota/status");
    assert(res.status === 401, `quota/status expected 401 when signed out, got ${res.status}`);
    const ct = res.headers["content-type"] || "";
    assert(ct.includes("application/json"), "quota/status should return JSON 401, not HTML");
    assert(!("location" in res.headers), "quota/status should not have Location (no redirect)");
    console.log("✅ /api/consolidated?action=quota/status 401 JSON without redirect");
  }

  // 5) Basic anti-loop heuristic: fetching the same page twice shouldn't flip-flop status rapidly
  {
    const a = await head(base + "/");
    await delay(150);
    const b = await head(base + "/");
    assert([200, 204].includes(a.status) && [200, 204].includes(b.status),
      "root status changed between two close fetches");
    console.log("✅ basic no-loop heuristic passed");
  }

  console.log("🎉 Guard checks passed");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
}); 