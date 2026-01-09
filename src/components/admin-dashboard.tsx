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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash, Pencil, Users, Layers, LogOut, Vote, BarChart, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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


interface AdminDashboardProps {
    initialCandidates: Candidate[];
    initialVotingStatus: boolean;
    initialShowResultsStatus: boolean;
    onLogout: () => void;
}

export function AdminDashboard({ 
    initialCandidates, 
    initialVotingStatus, 
    initialShowResultsStatus,
    onLogout 
}: AdminDashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [votingOpen, setVotingOpen] = useState(initialVotingStatus);
  const [showResults, setShowResults] = useState(initialShowResultsStatus);
  const { toast } = useToast();

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
        toast({
            variant: "destructive",
            title: "Kandidat Dihapus",
            description: "Data kandidat telah berhasil dihapus."
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

  const handleVotingToggle = async (checked: boolean) => {
    const result = await setVotingStatus(checked);
    if (result.success) {
        setVotingOpen(result.newState);
        toast({
            title: `Sesi Voting ${result.newState ? "Dibuka" : "Ditutup"}`,
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

  const handleShowResultsToggle = async (checked: boolean) => {
    const result = await setShowResultsStatus(checked);
    if (result.success) {
        setShowResults(result.newState);
        toast({
            title: `Halaman Hasil Suara ${result.newState ? "Ditampilkan" : "Disembunyikan"}`,
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };
  
  const handleResetVotes = async () => {
    const result = await resetAllVotes();
    if (result.success) {
        setCandidates(prev => prev.map(c => ({ ...c, votes: 0 })));
        toast({ title: 'Semua Suara Direset', description: 'Perolehan suara dan data pemilih telah dihapus.' });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dasbor Admin E-Voting</h1>
          <p className="text-muted-foreground">
            Kelola kandidat, pantau suara, dan atur sesi pemilihan.
          </p>
        </div>
        <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2" />
            Logout
        </Button>
      </div>
      
      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Statistik Pemilihan</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Suara Masuk</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalVotes}</div>
                    <p className="text-xs text-muted-foreground">Suara telah diberikan</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Kandidat</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCandidates}</div>
                    <p className="text-xs text-muted-foreground">Kandidat berpartisipasi</p>
                </CardContent>
            </Card>
        </div>
      </section>

      <section>
          <Card>
            <CardHeader>
                <CardTitle className="font-headline">Pengaturan Sesi Pemilihan</CardTitle>
                <CardDescription>Atur status sesi voting dan visibilitas hasil suara.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <Vote className="w-6 h-6 text-primary"/>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Buka Sesi Voting</p>
                        <p className="text-sm text-muted-foreground">
                            Izinkan pengguna untuk memberikan suara.
                        </p>
                    </div>
                    <Switch
                        checked={votingOpen}
                        onCheckedChange={handleVotingToggle}
                        id="voting-status"
                    />
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <BarChart className="w-6 h-6 text-primary"/>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Tampilkan Hasil Suara</p>
                        <p className="text-sm text-muted-foreground">
                            Tampilkan halaman hasil untuk publik.
                        </p>
                    </div>
                    <Switch
                        checked={showResults}
                        onCheckedChange={handleShowResultsToggle}
                        id="results-status"
                    />
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div className="flex items-center space-x-4 rounded-md border border-destructive/50 p-4 hover:bg-destructive/10 cursor-pointer">
                            <AlertTriangle className="w-6 h-6 text-destructive"/>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none text-destructive">Reset Semua Suara</p>
                                <p className="text-sm text-muted-foreground">
                                    Tindakan ini tidak dapat diurungkan.
                                </p>
                            </div>
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Anda Yakin Ingin Mereset Semua Suara?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ini akan menghapus semua suara yang telah masuk dan semua data pemilih. Gunakan ini hanya untuk memulai sesi pemilihan baru.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetVotes} className="bg-destructive hover:bg-destructive/90">Ya, Reset Sekarang</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
      </section>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline">Manajemen Kandidat</h2>
            <AddCandidateDialog onCandidateAdded={handleAddCandidateState} />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No.</TableHead>
                <TableHead>Nama Kandidat</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jumlah Suara</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-bold text-lg">{candidate.number}</TableCell>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell>{candidate.className}</TableCell>
                   <TableCell className="font-semibold">{candidate.votes}</TableCell>
                  <TableCell className="text-right">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                             <EditCandidateDialog 
                                candidate={candidate} 
                                onCandidateUpdate={handleUpdateCandidateState}
                             >
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Data
                                </DropdownMenuItem>
                            </EditCandidateDialog>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus Kandidat
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Tindakan ini tidak dapat diurungkan. Ini akan menghapus kandidat "{candidate.name}" secara permanen.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(candidate.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Ya, Hapus
                              </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {sortedCandidates.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Belum ada kandidat yang ditambahkan.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
