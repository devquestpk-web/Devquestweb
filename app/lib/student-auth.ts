import { getSupabaseAdminClient } from "./supabase-admin";

export async function requireStudent(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Authentication required", status: 401 } as const;
  
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) return { error: "Invalid or expired session", status: 401 } as const;
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  
  if (profile?.role !== "student") return { error: "Student access required", status: 403 } as const;
  
  return { supabase, user: data.user } as const;
}

export async function requireStudentOrAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Authentication required", status: 401 } as const;
  
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) return { error: "Invalid or expired session", status: 401 } as const;
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  
  if (profile?.role !== "student" && profile?.role !== "admin") {
    return { error: "Student or Administrator access required", status: 403 } as const;
  }
  
  return { supabase, user: data.user, role: profile.role } as const;
}
