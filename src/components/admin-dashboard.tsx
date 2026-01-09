"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCandidate, setVotingStatus, setShowResultsStatus, resetAllVotes } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { EditCandidateDialog } from "./edit-candidate-dialog";
import { AddCandidateDialog } from "./add-candidate-dialog";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, PieChart, Settings, LogOut, Vote, BarChart, AlertTriangle, Plus, Edit3, Trash2, TrendingUp, UserCheck, Clock, Search, AlertCircle } from "lucide-react";


interface AdminDashboardProps {
    initialCandidates: Candidate[];
    initialVotingStatus: boolean;
    initialShowResultsStatus: boolean;
    onLogout: () => void;
}

const StatCard = ({ label, value, change, icon } : { label: string, value: string, change: string, icon: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            {icon}
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                {icon}
            </div>
            <span className="text-sm font-medium text-neutral-400">{label}</span>
        </div>
        <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/5 ${change.includes('+') ? 'text-green-400' : 'text-neutral-400'}`}>
                {change}
            </span>
        </div>
    </motion.div>
);

const ProgressBar = ({ label, value, max, color } : { label: string, value: number, max: number, color: string }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-white">{label}</span>
                <span className="text-neutral-400">{value} Suara ({percentage}%)</span>
            </div>
            <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
};


const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            active ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
        {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
    </button>
);


export function AdminDashboard({
    initialCandidates,
    initialVotingStatus,
    initialShowResultsStatus,
    onLogout
}: AdminDashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [votingOpen, setVotingOpen] = useState(initialVotingStatus);
  const [showResults, setShowResults] = useState(initialShowResultsStatus);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const totalVotes = candidates.reduce((acc, c) => acc + c.votes, 0);
    return { totalCandidates, totalVotes };
  }, [candidates]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);
  
  const handleUpdateCandidateState = (updatedCandidate: Candidate) => {
    setCandidates(current =>
        current.map(c => c.id === updatedCandidate.id ? updatedCandidate : c)
    );
  };

  const handleAddCandidateState = (newCandidate: Candidate) => {
      setCandidates(current => [...current, newCandidate].sort((a,b) => a.number - b.number));
  }

  const handleDelete = async (candidateId: string) => {
    const result = await deleteCandidate(candidateId);
    if (result.success) {
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
    }
  };

  const handleVotingToggle = async (checked: boolean) => {
    const result = await setVotingStatus(checked);
    if (result.success) {
        setVotingOpen(result.newState);
    }
  };

  const handleShowResultsToggle = async (checked: boolean) => {
    const result = await setShowResultsStatus(checked);
    if (result.success) {
        setShowResults(result.newState);
    }
  };
  
  const handleResetVotes = async () => {
    const result = await resetAllVotes();
    if (result.success) {
        setCandidates(prev => prev.map(c => ({ ...c, votes: 0 })));
    }
  }

    const DYNAMIC_STATS = [
        { label: "Total Suara Masuk", value: String(stats.totalVotes), change: `${stats.totalVotes > 0 ? '+' : ''}${stats.totalVotes}`, icon: <UserCheck size={20} className="text-green-400" /> },
        { label: "Total Kandidat", value: `${stats.totalCandidates} Paslon`, change: "Final", icon: <Users size={20} className="text-purple-400" /> },
        { label: "Sesi Voting", value: votingOpen ? "Dibuka" : "Ditutup", change: "Live", icon: <Clock size={20} className="text-orange-400" /> },
    ];

    const getCandidateColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
        return colors[index % colors.length];
    }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-200 font-['Plus_Jakarta_Sans'] selection:bg-blue-500/30 overflow-hidden">
        <div className="fixed inset-0 h-full w-full z-0 bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <aside className="w-64 border-r border-white/5 bg-neutral-950/50 backdrop-blur-xl z-20 flex flex-col relative">
            <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">A</div>
                <span className="font-bold text-lg text-white tracking-tight">Admin Panel</span>
            </div>

            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-2">Menu Utama</div>
                <SidebarItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <SidebarItem icon={<Users size={18} />} label="Kandidat" active={activeTab === 'candidates'} onClick={() => setActiveTab('candidates')} />
                <SidebarItem icon={<PieChart size={18} />} label="Data Pemilih" active={activeTab === 'voters'} onClick={() => setActiveTab('voters')} />
                
                <div className="mt-8 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-2">Sistem</div>
                <SidebarItem icon={<Settings size={18} />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>

            <div className="p-4 border-t border-white/5">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
            <header className="h-16 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span>Dashboard</span>
                    <span className="text-neutral-600">/</span>
                    <span className="text-white capitalize">{activeTab}</span>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <input type="text" placeholder="Cari data..." className="bg-neutral-900 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors w-64"/>
                        <Search className="absolute left-3.5 top-2 text-neutral-500" size={14} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 border border-white/10"></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Selamat Datang, Admin!</h1>
                                <p className="text-neutral-400">Berikut adalah laporan real-time pemilihan OSIS.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {DYNAMIC_STATS.map((stat, idx) => (
                                    <StatCard key={idx} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} />
                                ))}
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5 h-full">
                                <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Hasil Sementara</h3>
                                <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded flex items-center gap-1 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> LIVE
                                </div>
                                </div>
                                <div className="space-y-6">
                                {sortedCandidates.map((c, idx) => (
                                    <ProgressBar key={c.id} label={`${c.name} (No. ${c.number})`} value={c.votes} max={stats.totalVotes} color={getCandidateColor(idx)} />
                                ))}
                                {sortedCandidates.length === 0 && <p className="text-center text-neutral-500 py-8">Belum ada suara yang masuk.</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'candidates' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white">Manajemen Kandidat</h2>
                                <AddCandidateDialog onCandidateAdded={handleAddCandidateState} />
                            </div>
                             <div className="bg-neutral-900 rounded-2xl border border-white/5">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b-white/10">
                                            <TableHead className="w-[80px]">No. Urut</TableHead>
                                            <TableHead>Nama Kandidat</TableHead>
                                            <TableHead>Kelas</TableHead>
                                            <TableHead>Total Suara</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {candidates.sort((a,b) => a.number - b.number).map((candidate) => (
                                            <TableRow key={candidate.id} className="border-b-white/5">
                                                <TableCell className="font-bold text-lg">{candidate.number}</TableCell>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell>{candidate.className}</TableCell>
                                                <TableCell>{candidate.votes}</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <EditCandidateDialog candidate={candidate} onCandidateUpdate={handleUpdateCandidateState}>
                                                             <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-blue-400"><Edit3 size={16} /></Button>
                                                        </EditCandidateDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-400"><Trash2 size={16} /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                                <AlertDialogDescription>Tindakan ini akan menghapus kandidat "{candidate.name}" secara permanen.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(candidate.id)} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                 {candidates.length === 0 && (
                                    <div className="text-center p-8 text-muted-foreground">
                                        Belum ada kandidat yang ditambahkan.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {(activeTab === 'voters' || activeTab === 'settings') && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                             {activeTab === 'settings' ? (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-white">Pengaturan Sesi</h2>
                                     <Card className="bg-neutral-900 border border-white/5">
                                        <CardHeader>
                                            <CardTitle>Kontrol Pemilihan</CardTitle>
                                            <CardDescription>Atur status sesi voting dan visibilitas hasil suara untuk publik.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-white/5">
                                                <div>
                                                    <h4 className="font-semibold text-white">Buka Sesi Voting</h4>
                                                    <p className="text-sm text-neutral-400">Izinkan atau hentikan pengguna memberikan suara.</p>
                                                </div>
                                                <Switch checked={votingOpen} onCheckedChange={handleVotingToggle} />
                                            </div>
                                            <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-white/5">
                                                <div>
                                                    <h4 className="font-semibold text-white">Tampilkan Halaman Hasil</h4>
                                                    <p className="text-sm text-neutral-400">Tampilkan atau sembunyikan halaman hasil suara dari publik.</p>
                                                </div>
                                                <Switch checked={showResults} onCheckedChange={handleShowResultsToggle} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                     <Card className="border-destructive/30 bg-destructive/5">
                                        <CardHeader>
                                            <CardTitle className="text-destructive">Zona Berbahaya</CardTitle>
                                            <CardDescription>Tindakan di bawah ini tidak dapat diurungkan.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button variant="destructive" className="w-full sm:w-auto">
                                                        <AlertTriangle className="mr-2" size={16}/> Reset Semua Suara
                                                     </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Anda Yakin Ingin Mereset Semua Suara?</AlertDialogTitle>
                                                        <AlertDialogDescription>Ini akan menghapus semua suara yang telah masuk dan semua data pemilih. Gunakan ini hanya untuk memulai sesi pemilihan baru.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleResetVotes} className="bg-destructive hover:bg-destructive/90">Ya, Reset Sekarang</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardContent>
                                    </Card>
                                </div>
                             ) : (
                                <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                                    <AlertCircle size={48} className="mb-4 opacity-20" />
                                    <p>Halaman {activeTab} sedang dalam pengembangan.</p>
                                </div>
                             )}
                        </motion.div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
}
