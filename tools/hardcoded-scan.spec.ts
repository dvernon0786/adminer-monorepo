import { isDocsFile } from "./hardcoded-scan.shared";
import * as fs from "fs";

describe("hardcoded-scan shared helper", () => {
  it("detects documentation files", () => {
    expect(isDocsFile("README.md")).toBe(true);
    expect(isDocsFile("docs/guide.txt")).toBe(true);
    expect(isDocsFile("examples/demo.js")).toBe(true);
    expect(isDocsFile("tools/hardcoded-scan.config.json")).toBe(true);
    expect(isDocsFile("tools/hardcoded-scan.ts")).toBe(true);
  });

  it("does not flag real code files", () => {
    expect(isDocsFile("src/index.ts")).toBe(false);
    expect(isDocsFile("apps/api/server.ts")).toBe(false);
  });
});

describe("CLERK_KEYS regex pattern", () => {
  const config = JSON.parse(
    fs.readFileSync("tools/hardcoded-scan.config.json", "utf8")
  );
  const clerkPattern = new RegExp(
    config.patterns.find((p: any) => p.id === "CLERK_KEYS").regex
  );

  const shouldMatch = [
    'sk_live_ABCDEFGHIJKLMNOP',
    'pk_live_1234567890abcdef',
    'sk-live-EXAMPLE_EXAMPLE_EXAMPLE',
    'pk-live-0987654321ZYXWVU'
  ];

  const shouldNotMatch = [
    'sk_fake_key',
    'not_a_key',
    'random text pk_123' // too short
  ];

  it("matches real Clerk-style keys", () => {
    for (const str of shouldMatch) {
      expect(clerkPattern.test(str)).toBe(true);
    }
  });

  it("does not match noise or short tokens", () => {
    for (const str of shouldNotMatch) {
      const result = clerkPattern.test(str);
      if (result) {
        console.log(`Pattern unexpectedly matched: "${str}"`);
      }
      expect(result).toBe(false);
    }
  });

  it("catches real Clerk keys even in documentation", () => {
    // These should match because they contain real Clerk key patterns
    expect(clerkPattern.test('docs/sk_live_SAMPLEONLY')).toBe(true);
    expect(clerkPattern.test('README with pk_live_1234567890abcdef')).toBe(true);
  });
}); 