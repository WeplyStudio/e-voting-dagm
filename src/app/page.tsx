"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Users, Award, Info, X, Vote, LogIn, FileText, CheckCircle, HelpCircle, Instagram, Twitter, Facebook, Mail, MapPin } from 'lucide-react';
import { getCandidates, castVote, getVoterStatus } from '@/lib/actions';
import type { Candidate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useDebounce } from 'react-use';


const FAQS = [
  { q: "Apakah pemilihan ini bersifat rahasia?", a: "Ya, sistem kami menjamin kerahasiaan pilihan Anda. Suara yang masuk tidak dapat dilacak kembali ke pemilih individu." },
  { q: "Bagaimana jika saya salah memilih calon?", a: "Pilihan yang sudah dikonfirmasi tidak dapat diubah kembali. Pastikan Anda membaca visi misi dengan seksama sebelum menekan tombol 'Ya, Saya Yakin'." },
  { q: "Apakah saya bisa memilih jika tidak punya token?", a: "Token pemilih adalah syarat wajib untuk memberikan suara. Jika Anda belum menerima, silakan hubungi panitia pemilihan." },
  { q: "Kapan hasil voting diumumkan?", a: "Hasil sementara dapat dilihat secara real-time di halaman Hasil Suara. Hasil resmi akan ditetapkan setelah sesi voting ditutup." }
];

const STEPS = [
  { icon: <LogIn size={24} />, title: "Dapatkan Token", desc: "Dapatkan token unik dari panitia pemilihan untuk bisa memberikan suara." },
  { icon: <FileText size={24} />, title: "Pelajari Kandidat", desc: "Baca visi misi setiap paslon. Jangan memilih seperti membeli kucing dalam karung." },
  { icon: <Vote size={24} />, title: "Tentukan Pilihan", desc: "Klik tombol Vote pada kandidat pilihanmu. Satu akun hanya satu suara." },
  { icon: <CheckCircle size={24} />, title: "Selesai", desc: "Anda akan mendapatkan notifikasi bahwa hak suara telah digunakan." }
];

const Badge = ({ children, className }: {children: React.ReactNode, className?: string}) => (
  <div className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle }: {title: string, subtitle: string}) => (
  <div className="text-center mb-16 space-y-2">
    <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
    <p className="text-neutral-400">{subtitle}</p>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, actions }: {isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, actions?: React.ReactNode}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="text-neutral-300">
              {children}
            </div>
            {actions && (
              <div className="mt-8 flex justify-end gap-3">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function Home() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalType, setModalType] = useState<null | 'info' | 'vote'>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [voterIdentifier, setVoterIdentifier] = useState("");
  const [isCheckingVoter, setIsCheckingVoter] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      const data = await getCandidates();
      setCandidates(data);
    };
    fetchCandidates();
  }, []);

  const checkVoterStatus = useCallback(async (identifier: string) => {
      if (!identifier) {
        setHasVoted(false);
        setVotedId(null);
        return;
      };
      setIsCheckingVoter(true);
      const status = await getVoterStatus(identifier);
      if (status.hasVoted) {
          setHasVoted(true);
          setVotedId(status.votedCandidateId || null);
          toast({
              title: "Token Sudah Digunakan",
              description: "Token ini sudah pernah digunakan untuk memilih.",
          });
      } else {
          setHasVoted(false);
          setVotedId(null);
      }
      setIsCheckingVoter(false);
  }, [toast]);

  useDebounce(() => {
      checkVoterStatus(voterIdentifier);
  }, 1000, [voterIdentifier, checkVoterStatus]);


  const openInfo = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalType('info');
  };

  const openVote = (candidate: Candidate) => {
    if (hasVoted) return;
    if (!voterIdentifier.trim()) {
        toast({
            variant: "destructive",
            title: "Token Pemilih Diperlukan",
            description: "Silakan masukkan token Anda di bawah daftar kandidat sebelum memilih.",
        });
        const tokenInput = document.getElementById('voter-token-input');
        tokenInput?.focus();
        tokenInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    setSelectedCandidate(candidate);
    setModalType('vote');
  };

  const confirmVote = async () => {
    if (!selectedCandidate) return;

    const formData = new FormData();
    formData.append('candidateId', selectedCandidate.id);
    formData.append('voterIdentifier', voterIdentifier);
    
    const result = await castVote(formData);

    if (result.success) {
        setHasVoted(true);
        setVotedId(selectedCandidate.id);
        setModalType(null);
        setSelectedCandidate(null);
        toast({
            title: "Suara Berhasil Direkam!",
            description: "Terima kasih telah berpartisipasi.",
            className: "bg-green-500 text-white"
        });
    } else {
        toast({
            variant: "destructive",
            title: "Gagal Memilih",
            description: result.message || "Terjadi kesalahan yang tidak diketahui.",
        });
        setModalType(null);
        if (result.message?.includes("sudah digunakan")) {
            setHasVoted(true);
        }
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-['Plus_Jakarta_Sans'] selection:bg-blue-500/30 overflow-x-hidden relative">

      <div className="absolute inset-0 h-full w-full bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent pointer-events-none"></div>

      <nav className="relative z-40 border-b border-white/5 backdrop-blur-md bg-neutral-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="font-bold text-lg tracking-tight text-white">E-Voting OSIS</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="/leaderboard" className="hover:text-white transition-colors">Hasil Suara</a>
            <button onClick={() => scrollToSection('cara-voting')} className="hover:text-white transition-colors">Cara Voting</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
            <div className="flex items-center gap-2 text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Voting
            </div>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-6 inline-block">
              Periode 2024 - 2025
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Tentukan Masa Depan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                Sekolah Kita.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Gunakan hak suara kamu secara bijak, jujur, dan transparan. Satu suara sangat berarti untuk perubahan yang lebih baik.
            </p>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2, duration: 0.5 }}
             className="flex justify-center gap-4"
          >
             <button onClick={() => scrollToSection('candidates')} className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all flex items-center gap-2">
               Lihat Kandidat <ChevronRight size={18} />
             </button>
          </motion.div>
        </div>
      </section>

      <section id="statistik" className="relative z-10 py-12 px-6 border-y border-white/5 bg-neutral-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">{candidates.length}</div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider">Total Kandidat</div>
            </div>
            <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-1">{totalVotes}</div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider">Total Suara Masuk</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
                <div className="text-4xl font-bold text-purple-400 mb-1">Live</div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider">Status Pemilihan</div>
            </div>
        </div>
      </section>

      <section id="candidates" className="relative z-10 py-24 px-6 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Daftar Pasangan Calon" subtitle="Pilih pasangan terbaik sesuai hati nurani." />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className={`group relative bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)] transition-all duration-300 ${votedId === candidate.id ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-xl font-bold text-white z-20">
                  {candidate.number}
                </div>

                {votedId === candidate.id && (
                   <div className="absolute top-4 left-4 z-20 bg-green-500/90 backdrop-blur text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                     <Check size={12} /> Pilihan Kamu
                   </div>
                )}

                <div className="h-64 bg-gradient-to-b from-neutral-800 to-neutral-900 relative overflow-hidden flex items-end justify-center">
                    <Image
                      src={candidate.photoUrl}
                      alt={`Foto ${candidate.name}`}
                      width={192}
                      height={192}
                      className="w-48 h-48 object-cover drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                </div>

                <div className="p-6 relative">
                   <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-1">{candidate.name}</h3>
                     <p className="text-sm text-neutral-400 mb-2">{candidate.className}</p>
                     <div className="h-0.5 w-12 bg-blue-500 rounded-full mb-3"></div>
                   </div>

                   <div className="grid grid-cols-2 gap-3 mt-6">
                     <button
                        onClick={() => openInfo(candidate)}
                        className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors border border-white/5 flex items-center justify-center gap-2"
                      >
                        <Info size={16} /> Visi & Misi
                     </button>
                     <button
                        onClick={() => openVote(candidate)}
                        disabled={hasVoted || isCheckingVoter}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border border-transparent flex items-center justify-center gap-2
                          ${(hasVoted || isCheckingVoter)
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-blue-500 hover:text-white hover:border-blue-400'
                          }`}
                      >
                        <Vote size={16} /> Vote
                     </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold text-white mb-3">Masukkan Token Pemilih Anda</h3>
             <p className="text-neutral-400 text-sm mb-4">
                    Gunakan token unik yang Anda terima dari panitia untuk memberikan suara.
                </p>
            <input
                id="voter-token-input"
                type="text"
                placeholder="Contoh: OSIS-VOTE-XXXX"
                className="w-full text-center text-lg h-12 bg-neutral-800/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                value={voterIdentifier}
                onChange={(e) => setVoterIdentifier(e.target.value)}
                disabled={hasVoted || isCheckingVoter}
            />
          </div>

        </div>
      </section>

      <section id="cara-voting" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Cara Menggunakan Hak Suara" subtitle="Ikuti 4 langkah mudah berikut ini." />

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:bg-neutral-900 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   {step.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{idx + 1}. {step.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>

                {idx !== STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-3 w-6 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent z-0"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 py-24 px-6 bg-neutral-900/30 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
           <SectionHeader title="Pertanyaan Umum (FAQ)" subtitle="Masih bingung? Cek jawaban di bawah ini." />

           <div className="space-y-4">
             {FAQS.map((faq, idx) => (
               <motion.div
                 key={idx}
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 viewport={{ once: true }}
                 className="p-6 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/10 transition-colors"
               >
                 <h4 className="flex items-start gap-3 text-lg font-semibold text-white mb-2">
                   <HelpCircle className="text-purple-500 shrink-0 mt-1" size={20} />
                   {faq.q}
                 </h4>
                 <p className="text-neutral-400 text-sm ml-8 leading-relaxed">
                   {faq.a}
                 </p>
               </motion.div>
             ))}
           </div>
        </div>
      </section>

      <Footer />

      <Modal
        isOpen={modalType === 'info' && !!selectedCandidate}
        onClose={() => setModalType(null)}
        title={`Kandidat No. ${selectedCandidate?.number}`}
      >
        <div className="space-y-6">
           <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
              <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <Award size={18} /> Visi
              </h4>
              <p className="leading-relaxed">{selectedCandidate?.vision}</p>
           </div>

           <div>
              <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                <Users size={18} /> Misi
              </h4>
              <p className="leading-relaxed whitespace-pre-line text-neutral-300">
                {selectedCandidate?.mission}
              </p>
           </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'vote' && !!selectedCandidate}
        onClose={() => setModalType(null)}
        title="Konfirmasi Pilihan"
        actions={
          <>
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmVote}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              Ya, Saya Yakin
            </button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-neutral-800 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white/10">
             <Image src={selectedCandidate?.photoUrl || ''} alt={selectedCandidate?.name || ''} width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <p className="text-lg text-white font-medium mb-1">
             Anda akan memilih <br />
             <span className="text-blue-400 font-bold text-xl">{selectedCandidate?.name}</span>
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Pilihan tidak dapat diubah setelah tombol konfirmasi ditekan.
          </p>
        </div>
      </Modal>
    </div>
  );
}

const Footer = () => {
    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className="relative z-10 pt-20 pb-10 border-t border-white/10 bg-neutral-950 text-sm">
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
                            <li><button onClick={() => scrollToSection('candidates')} className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Kandidat</button></li>
                            <li><button onClick={() => scrollToSection('cara-voting')} className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Panduan Voting</button></li>
                            <li><a href="/leaderboard" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Live Hasil</a></li>
                            <li><button onClick={() => scrollToSection('faq')} className="hover:text-blue-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> FAQ</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 text-lg">Hubungi Kami</h4>
                        <ul className="space-y-4 text-neutral-400">
                            <li className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                    <MapPin size={16} className="text-blue-400" />
                                </div>
                                <span className="leading-relaxed">Jl. D.I. Panjaitan No.9, Melayu Kota Piring, Kec. Tanjungpinang Tim., Kota Tanjung Pinang, Kepulauan Riau 29125</span>
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
