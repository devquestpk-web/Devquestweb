import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function ProfileModule() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    city: "",
    github_url: "",
    linkedin_url: "",
    discord_handle: "",
    skills_input: "",
  });
  
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            full_name: data.profile.full_name || "",
            bio: data.profile.bio || "",
            phone: data.profile.phone || "",
            city: data.profile.city || "",
            github_url: data.profile.github_url || "",
            linkedin_url: data.profile.linkedin_url || "",
            discord_handle: data.profile.discord_handle || "",
            skills_input: (data.profile.skills || []).join(", "),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const skillsArray = formData.skills_input.split(",").map(s => s.trim()).filter(s => s.length > 0);
      
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert(result.error || "Update failed");
      }
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .6fr)' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>ACCOUNT SETTINGS</p>
            <h2>Student Profile</h2>
          </div>
        </div>
        
        <form onSubmit={handleSave} className="portal-form">
          <div className="portal-form-group">
            <label>Full Name</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
          </div>
          
          <div className="portal-form-group">
            <label>Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about your learning goals..." rows={3} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="portal-form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="portal-form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
            </div>
          </div>
          
          <div className="portal-form-group" style={{ marginTop: 24 }}>
            <label>Tech Stack / Skills (comma separated)</label>
            <input type="text" name="skills_input" value={formData.skills_input} onChange={handleChange} placeholder="React, Python, UI Design..." />
          </div>
          
          <h3 style={{ fontSize: "1.1rem", marginTop: 32, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #edf0f5" }}>Social Links</h3>
          
          <div className="portal-form-group">
            <label>GitHub URL</label>
            <input type="url" name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/username" />
          </div>
          
          <div className="portal-form-group">
            <label>LinkedIn URL</label>
            <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          </div>
          
          <div className="portal-form-group">
            <label>Discord Handle</label>
            <input type="text" name="discord_handle" value={formData.discord_handle} onChange={handleChange} placeholder="username#1234" />
          </div>
          
          <div className="portal-form-actions" style={{ marginTop: 32 }}>
            <button type="submit" className="portal-primary" disabled={saving}>
              {saving ? <LoaderCircle className="spin" /> : <Save />} Save Changes
            </button>
          </div>
        </form>
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <section className="portal-panel" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#1c64de", color: "white", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "2rem", fontWeight: 700 }}>
            {formData.full_name?.charAt(0) || "S"}
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{formData.full_name || "Student"}</h3>
          <p style={{ margin: 0, color: "#748299", fontSize: "0.85rem" }}>{formData.city || "Pakistan"}</p>
          
          {formData.skills_input && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 24 }}>
              {formData.skills_input.split(",").map((s, i) => s.trim() ? (
                <span key={i} style={{ padding: "4px 10px", background: "#f0f4f8", color: "#4a5568", fontSize: "0.75rem", borderRadius: 12 }}>{s.trim()}</span>
              ) : null)}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
