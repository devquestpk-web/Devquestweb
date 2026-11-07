import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeCertificateTemplate } from "../app/lib/certificate-template.ts";

test("certificate template configuration is constrained to safe design values", () => {
  const config = sanitizeCertificateTemplate({ designStyle: "unknown", primaryColor: "red", accentColor: "#22aaff", certificateTitle: "  Completion Award  " });
  assert.equal(config.designStyle, "midnight");
  assert.equal(config.primaryColor, "#071a38");
  assert.equal(config.accentColor, "#22aaff");
  assert.equal(config.certificateTitle, "Completion Award");
});
