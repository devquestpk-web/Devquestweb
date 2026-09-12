import { useEffect, useState } from "react";
import { Circle, Download, FileText, FolderArchive, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function VaultModule() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/vault", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.resources) {
          setResources(data.resources);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch(`/api/student/vault/${resourceId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await response.json();
      
      if (data.downloadUrl) {
        // Trigger download
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || "Could not generate download link");
      }
    } catch (e) {
      alert("Download failed");
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>DOWNLOADS</p>
            <h2>Resource Vault</h2>
          </div>
        </div>
        
        <p style={{ color: "#637086", marginBottom: 32 }}>Access source code, slides, and reference materials for courses and webinars you're enrolled in.</p>
        
        <div className="vault-resource-list">
          {resources.map((resource) => (
            <article className="vault-item" key={resource.id}>
              <div className="vault-item-icon">
                {resource.file_type.includes("ZIP") ? <FolderArchive size={20} color="#748299" /> : <FileText size={20} color="#748299" />}
              </div>
              <div className="vault-item-content">
                <h3>{resource.title}</h3>
                <span className="vault-item-meta">{resource.source_title} • {resource.item_type}</span>
              </div>
              <button className="portal-secondary" onClick={() => handleDownload(resource.id, resource.title)}>
                <Download size={16} /> Download
              </button>
            </article>
          ))}
          
          {resources.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1", padding: 60 }}>
              <Circle /> No resources available for your current enrollments.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
