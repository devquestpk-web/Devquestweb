export type SearchableStudent = {
  id: string;
  full_name?: string | null;
  student_id?: string | null;
  email?: string | null;
  phone?: string | null;
};

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9@.+-]+/g, " ")
    .trim();
}

function compact(value: unknown) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

export function searchStudents<T extends SearchableStudent>(students: T[], query: string, limit = 50): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [...students]
    .sort((a, b) => normalize(a.full_name).localeCompare(normalize(b.full_name)))
    .slice(0, limit);

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const compactQuery = compact(query);
  return students
    .map((student) => {
      const fields = [student.full_name, student.student_id, student.email, student.phone].map(normalize);
      const compactFields = [student.student_id, student.email, student.phone].map(compact);
      const haystack = fields.join(" ");
      if (!queryTokens.every((token) => haystack.includes(token)) && !compactFields.some((field) => field.includes(compactQuery))) return null;
      let score = 1;
      if (fields.some((field) => field === normalizedQuery) || compactFields.some((field) => field === compactQuery)) score = 5;
      else if (fields.some((field) => field.startsWith(normalizedQuery)) || compactFields.some((field) => field.startsWith(compactQuery))) score = 4;
      else if (fields.some((field) => field.split(" ").some((word) => word.startsWith(normalizedQuery)))) score = 3;
      else if (fields.some((field) => field.includes(normalizedQuery))) score = 2;
      return { student, score };
    })
    .filter((entry): entry is { student: T; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score || normalize(a.student.full_name).localeCompare(normalize(b.student.full_name)))
    .slice(0, limit)
    .map((entry) => entry.student);
}
