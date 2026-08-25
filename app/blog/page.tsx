"use client";
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icons, Navigation, Footer, PageHero } from "@/components/site";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => { fetch("/api/blog").then((r) => r.json()).then(setPosts).catch(() => {}); }, []);
  return (<>
    <Navigation />
    <main>
      <PageHero eyebrow="Blog" title="Notes from" italic="the shield wall." subtitle="Engineering deep-dives and honest product decisions. Written by humans, for humans." />
      <div className="max-w-6xl mx-auto px-6 pb-28 grid md:grid-cols-2 gap-6">
        {posts.map((p, i) => (
          <motion.article key={p.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 2) * 0.1 }} className="group p-8 rounded-2xl border border-slate-800 bg-slate-950 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-5"><span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">{p.category}</span><span>{p.read_time} read</span></div>
            <h2 className="font-serif text-2xl font-semibold text-white leading-snug mb-4 group-hover:text-blue-400 transition-colors">{p.title}</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-6">{p.excerpt}</p>
            <Link href={`/blog/${p.slug}`} className="inline-flex items-center gap-2 text-sm text-blue-400">Read article<Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
          </motion.article>
        ))}
      </div>
    </main>
    <Footer />
  </>);
}
