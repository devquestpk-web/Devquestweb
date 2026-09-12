import { NextResponse } from "next/server";
import { requireStudent } from "../../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  try {
    const { resourceId } = await params;
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch the resource details
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Verify user is enrolled in the associated item
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", resource.item_type)
      .eq(resource.item_type === "COURSE" ? "course_id" : "webinar_id", resource.item_type === "COURSE" ? resource.course_id : resource.webinar_id)
      .single();
    
    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in the associated course or webinar" }, { status: 403 });
    }

    // Generate signed URL (Assuming resources are stored in a private Supabase bucket 'student-vault')
    // For now, if the fileUrl is a public URL or absolute path, we just return it. 
    // If it's a relative path in a bucket, we generate a signed URL.
    let downloadUrl = resource.file_url;
    
    if (!downloadUrl.startsWith("http")) {
      const { data } = await supabase.storage
        .from("student-vault")
        .createSignedUrl(resource.file_url, 3600); // 1 hour expiry
        
      if (data?.signedUrl) {
        downloadUrl = data.signedUrl;
      } else {
        return NextResponse.json({ error: "Could not generate secure download link" }, { status: 500 });
      }
    }

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    return NextResponse.json({ error: "Could not process download request" }, { status: 500 });
  }
}
