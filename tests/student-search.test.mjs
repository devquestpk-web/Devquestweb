import assert from "node:assert/strict";
import test from "node:test";
import { searchStudents } from "../app/lib/student-search.ts";

const students = [
  { id: "1", full_name: "Humair Tariq", student_id: "DQ-STU-2026-001011", email: "humair@example.com", phone: "+92 300 3524016" },
  { id: "2", full_name: "Huma Ali", student_id: "DQ-STU-2026-001012", email: "huma@example.com", phone: "03001234567" },
];

test("student search supports names, stable IDs, email and compact phone numbers", () => {
  assert.equal(searchStudents(students, "Humair")[0]?.id, "1");
  assert.equal(searchStudents(students, "001012")[0]?.id, "2");
  assert.equal(searchStudents(students, "huma@example.com")[0]?.id, "2");
  assert.equal(searchStudents(students, "923003524016")[0]?.id, "1");
});

test("student search ranks exact matches and supports multi-token queries", () => {
  assert.equal(searchStudents(students, "huma ali")[0]?.id, "2");
  assert.deepEqual(searchStudents(students, "missing"), []);
});
