import { useEffect, useState, useRef } from "react";
import { LoaderCircle, Save, Camera, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function ProfileModule() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    city: "",
    github_url: "",
    linkedin_url: "",
    discord_handle: "",
    skills_input: "",
    avatar_url: "",
  });
  
  const supabase = getSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            avatar_url: data.profile.avatar_url || "",
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    
    // Size check (max 5MB)
    if (file.size > 5242880) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("No active session");

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('student-avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('student-avatars')
        .getPublicUrl(fileName);

      const avatar_url = publicUrlData.publicUrl;
      
      // Instantly update the state
      setFormData(prev => ({ ...prev, avatar_url }));
      
      // Auto-save the profile when image changes
      await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ ...formData, avatar_url })
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Make sure the student-avatars bucket exists and is public.");
    } finally {
      setUploadingImage(false);
    }
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
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    );
  }

  const skillsList = formData.skills_input.split(",").map(s => s.trim()).filter(s => s.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 pb-12">
      
      {/* Left Column: Form */}
      <div className="lg:col-span-2">
        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="mb-8">
            <span className="text-xs font-bold tracking-widest text-blue-600/80 mb-2 block">ACCOUNT SETTINGS</span>
            <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
          </div>
          
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                type="text" name="full_name" value={formData.full_name} onChange={handleChange} required 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Bio</label>
              <textarea 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about your learning goals..." rows={3} 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  type="text" name="phone" value={formData.phone} onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">City</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  type="text" name="city" value={formData.city} onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-sm font-semibold text-slate-700">Tech Stack / Skills (comma separated)</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                type="text" name="skills_input" value={formData.skills_input} onChange={handleChange} placeholder="React, Python, UI Design..." 
              />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mt-6 pt-6 border-t border-slate-100">Social Links</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">GitHub URL</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                type="url" name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/username" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">LinkedIn URL</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Discord Handle</label>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                type="text" name="discord_handle" value={formData.discord_handle} onChange={handleChange} placeholder="username#1234" 
              />
            </div>
            
            <div className="pt-6 mt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 transition-all"
              >
                {saving ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} 
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Right Column: Preview */}
      <aside className="lg:col-span-1">
        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center sticky top-24">
          
          <div className="relative group mb-6">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt={formData.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-slate-300">
                  {formData.full_name?.charAt(0)?.toUpperCase() || <UserRound size={40} />}
                </span>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2.5 text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
              title="Upload profile picture"
            >
              {uploadingImage ? <LoaderCircle size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleImageUpload} 
            />
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-1">{formData.full_name || "Student Name"}</h3>
          <p className="text-sm text-slate-500 font-medium mb-6">{formData.city || "Student"}</p>
          
          {skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {skillsList.map((skill, i) => (
                <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 w-full">
              <p className="text-xs text-slate-400">Add some skills to your profile to see them here.</p>
            </div>
          )}
          
        </section>
      </aside>
    </div>
  );
}
