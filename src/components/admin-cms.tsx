"use client";
import { useState } from "react";
import { toast } from "@/components/toast";

export function AdminCMS({ headers, loadAll, initialPages }: any) {
  const [pages, setPages] = useState(initialPages || []);
  const [selected, setSelected] = useState<any>(null);
  const [type, setType] = useState("blog");

  const save = async () => {
    if (!selected.title || !selected.slug) { toast("error", "Title and Slug are required"); return; }
    
    // Await the headers function if it's a function, otherwise use it as an object
    const authHeaders = typeof headers === 'function' ? await headers() : headers;
    
    const res = await fetch("/api/cms", { 
      method: "POST", 
      headers: authHeaders, 
      body: JSON.stringify(selected) 
    });
    
    if (res.ok) { 
      toast("success", "Saved successfully"); 
      if (loadAll) await loadAll(); 
    } else { 
      const d = await res.json(); 
      toast("error", d.error || "Failed"); 
    }
  };

  const deletePage = async () => {
    if (!selected?.id) return;
    
    const authHeaders = typeof headers === 'function' ? await headers() : headers;
    
    const res = await fetch(`/api/cms?id=${selected.id}`, { 
      method: "DELETE", 
      headers: authHeaders 
    });
    
    if (res.ok) { 
      toast("success", "Deleted"); 
      setSelected(null); 
      if (loadAll) await loadAll(); 
    } else {
      toast("error", "Failed to delete");
    }
  };

  const filtered = pages.filter((p: any) => p.type === type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Content Manager</h2>
        <div className="flex gap-2">
          {["blog", "faq", "legal", "docs"].map(t => (
            <button key={t} onClick={() => { setType(t); setSelected(null); }} className={`px-4 py-2 rounded-lg text-sm transition-colors ${type === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
          <button onClick={() => setSelected({ slug: "", title: "", content: "", type, is_published: false })} className="w-full p-3 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 text-sm text-center">
            + Create New {type}
          </button>
          {filtered.map((p: any) => (
            <div key={p.id} onClick={() => setSelected(p)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selected?.id === p.id ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900 hover:border-slate-700"}`}>
              <p className="text-sm font-medium text-white truncate">{p.title || "Untitled"}</p>
              <p className="text-xs text-slate-500 mt-1">{p.slug} {p.is_published ? "•  Live" : "• 🔴 Draft"}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4 p-6 rounded-xl border border-slate-800 bg-slate-900">
              <input value={selected.title} onChange={e => setSelected({...selected, title: e.target.value})} placeholder="Title" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
              <input value={selected.slug} onChange={e => setSelected({...selected, slug: e.target.value})} placeholder="slug (e.g. my-first-post)" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm" />
              <textarea value={selected.content} onChange={e => setSelected({...selected, content: e.target.value})} placeholder="Content..." rows={12} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm" />
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={selected.is_published} onChange={e => setSelected({...selected, is_published: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-400">Publish to live site</span>
                </label>
                <div className="flex gap-3">
                  {selected.id && <button onClick={deletePage} className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10">Delete</button>}
                  <button onClick={save} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Save Page</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-slate-500">Select a page to edit or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
}
