
import { ResultsDisplay } from "@/components/results-display";
import { getCandidates, getShowResultsStatus } from "@/lib/actions";
import { Lock, Instagram, Twitter, Facebook, Mail, MapPin, ChevronRight, Vote } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";

const Footer = () => {
    return (
        <footer className="relative z-10 pt-20 pb-10 border-t border-white/10 bg-neutral-950 text-sm mt-24">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <a href="/" className="flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">E</div>
                            <span className="font-bold text-xl text-white tracking-tight">E-Voting OSIS</span>
                        </a>
                        <p className="text-neutral-400 leading-relaxed max-w-sm">
                            Platform pemilihan Ketua OSIS masa depan yang jujur, adil, dan transparan. Suara Anda menentukan arah kemajuan sekolah kita.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-blue-600 hover:text-white transition-all border border-white/5 hover:border-blue-500/50">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-blue-400 hover:text-white transition-all border border-white/5 hover:border-blue-400/50">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-blue-700 hover:text-white transition-all border border-white/5 hover:border-blue-700/50">
                                <Facebook size={18} />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 text-lg">Menu Utama</h4>
                        <ul className="space-y-4 text-neutral-400">
                            <li><Link href="/#candidates" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Kandidat</Link></li>
                            <li><Link href="/#cara-voting" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Panduan Voting</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Live Hasil</Link></li>
                            <li><Link href="/#faq" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> FAQ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 text-lg">Hubungi Kami</h4>
                        <ul className="space-y-4 text-neutral-400">
                            <li className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                    <MapPin size={16} className="text-blue-400" />
                                </div>
                                <span className="leading-relaxed">Jl. Pendidikan No. 123, Gedung OSIS Lt. 2, Jakarta Selatan</span>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                    <Mail size={16} className="text-purple-400" />
                                </div>
                                <span>panitia@osis-sekolah.sch.id</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500">
                    <p>© 2024 Komisi Pemilihan OSIS. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1 normal-case tracking-normal border-l border-white/10 pl-6">
                            Made with <span className="text-red-500 animate-pulse">♥</span> by Tim IT
                        </span>
                    </div>
                </div>
            </div>
      </footer>
    )
}

export default async function ResultsPage() {
  const showResults = await getShowResultsStatus();
  const candidates = await getCandidates();
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-200">
       <div className="absolute inset-0 h-full w-full bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 z-10">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Hasil Perolehan Suara</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Perhitungan suara pemilihan ketua OSIS periode 2024-2025.
            </p>
        </div>

        {!showResults ? (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-6 text-xl font-medium">Hasil Suara Belum Dirilis</h3>
                <p className="mt-2 text-base text-muted-foreground max-w-md mx-auto">
                  Hasil perolehan suara akan ditampilkan di sini setelah sesi voting selesai dan dikonfirmasi oleh admin.
                </p>
            </div>
        ) : (
            <ResultsDisplay initialCandidates={candidates} />
        )}
      </main>
      <Footer />
    </div>
  );
}
