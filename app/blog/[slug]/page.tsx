"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icons, MotionLink, Footer, PageHero, CTASection, CONTACTS } from "@/components/site";
import { Navigation } from "@/components/Navigation";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  useEffect(() => { if (slug) fetch(`/api/blog?slug=${slug}`).then((r) => r.json()).then(setPost).catch(() => {}); }, [slug]);

  if (!post) return (<><Navigation /><div className="min-h-screen pt-40 max-w-3xl mx-auto px-6 space-y-6">{[1, 2, 3].map((i) => (<div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />))}</div><Footer /></>);

  return (<>
    <Navigation />
    <main className="pt-40 pb-28 max-w-3xl mx-auto px-6">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-10">Back to blog</Link>
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-6"><span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">{post.category}</span><span>{post.read_time} read</span></div>
      <h1 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight mb-10">{post.title}</h1>
      {String(post.content).split("\n\n").map((para: string, i: number) => (
        <p key={i} className="text-lg text-slate-300 font-light leading-relaxed mb-8">{para}</p>
      ))}
    </main>
    <Footer />
  </>);
}
