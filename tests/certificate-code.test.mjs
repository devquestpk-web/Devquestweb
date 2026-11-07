import assert from "node:assert/strict";
import test from "node:test";
import { certificateCodeFromInput } from "../app/lib/certificate-code.ts";

const origin = "https://www.devquestpk.com";
const code = "DQ-CERT-2026-ABCDEF012345";

test("accepts a certificate code and DevQuest verification QR links", () => {
  assert.equal(certificateCodeFromInput(code, origin), code);
  assert.equal(certificateCodeFromInput(`https://devquestpk.com/verify/${code}`, origin), code);
  assert.equal(certificateCodeFromInput(`https://www.devquestpk.com/verify/${code}?ref=qr`, origin), code);
  assert.equal(certificateCodeFromInput(`https://preview.vercel.app/verify/${code}`, "https://preview.vercel.app"), code);
});

test("rejects unrelated URLs and paths", () => {
  assert.equal(certificateCodeFromInput(`https://devquestpk.com.evil.test/verify/${code}`, origin), null);
  assert.equal(certificateCodeFromInput(`https://example.com/verify/${code}`, origin), null);
  assert.equal(certificateCodeFromInput(`https://devquestpk.com/admin/${code}`, origin), null);
  assert.equal(certificateCodeFromInput("javascript:alert(1)", origin), null);
  assert.equal(certificateCodeFromInput("", origin), null);
});
