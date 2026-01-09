"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { castVote } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { ConfettiCelebration } from "./confetti-celebration";


interface CandidateListProps {
  initialCandidates: Candidate[];
}

export function CandidateList({ initialCandidates }: CandidateListProps) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [isLoading, setIsLoading] = useState(false);
  const [voterIdentifier, setVoterIdentifier] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleVote = async (candidateId: string) => {
    if (!voterIdentifier.trim()) {
      toast({
        variant: "destructive",
        title: "Token Pemilih Diperlukan",
        description: "Silakan masukkan token pemilih Anda sebelum memilih.",
      });
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    formData.append('candidateId', candidateId);
    formData.append('voterIdentifier', voterIdentifier);

    const result = await castVote(formData);

    if (result.success) {
      toast({
        title: "Suara Berhasil Direkam!",
        description: "Terima kasih telah berpartisipasi dalam pemilihan.",
      });
      setShowConfetti(true);
      // Optimistically update vote count
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
      ));
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memilih",
        description: result.message || "Terjadi kesalahan yang tidak diketahui.",
      });
    }

    setIsLoading(false);
  };
  
  if (showConfetti) {
    return (
        <div className="text-center py-20">
            <ConfettiCelebration />
            <h2 className="text-3xl font-headline font-bold">Terima Kasih!</h2>
            <p className="mt-4 text-lg text-muted-foreground">Suara Anda telah berhasil direkam.</p>
        </div>
    )
  }

  return (
    <div className="space-y-12">
        <Card className="max-w-md mx-auto bg-card/30 border-primary/20">
            <CardHeader>
                <CardTitle className="text-center font-headline">Masukkan Token Pemilih Anda</CardTitle>
                <CardDescription className="text-center">
                    Gunakan token unik yang Anda terima dari panitia untuk memberikan suara.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Input 
                    type="text"
                    placeholder="Contoh: OSIS-VOTE-XXXX"
                    className="text-center text-lg h-12"
                    value={voterIdentifier}
                    onChange={(e) => setVoterIdentifier(e.target.value)}
                />
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-start">
            {candidates.map((candidate) => (
                <Card key={candidate.id} className="flex flex-col text-center overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                    <CardHeader className="p-0">
                        <div className="aspect-square relative">
                            <Image
                                src={candidate.photoUrl}
                                alt={`Foto ${candidate.name}`}
                                fill
                                className="object-cover"
                            />
                             <div className="absolute top-4 right-4 bg-background/80 text-primary font-bold font-headline text-3xl w-16 h-16 rounded-full flex items-center justify-center border-4 border-primary/50">
                                {candidate.number}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow flex flex-col">
                        <CardTitle className="font-headline text-2xl">{candidate.name}</CardTitle>
                        <CardDescription>{candidate.className}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/30 flex-col gap-2">
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">Lihat Visi & Misi</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">{candidate.name}</DialogTitle>
                                    <DialogDescription>Kandidat Nomor Urut {candidate.number}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <h3 className="font-bold text-primary text-lg mb-2">Visi</h3>
                                        <p className="text-muted-foreground">{candidate.vision}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary text-lg mb-2">Misi</h3>
                                        <p className="text-muted-foreground whitespace-pre-line">{candidate.mission}</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="secondary" className="w-full" onClick={() => handleVote(candidate.id)} disabled={isLoading}>
                                         {isLoading ? <><Loader2 className="mr-2 animate-spin" /> Memproses...</> : "Pilih Kandidat Ini"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button className="w-full" onClick={() => handleVote(candidate.id)} disabled={isLoading}>
                           {isLoading ? <><Loader2 className="mr-2 animate-spin" /> Memproses...</> : `Pilih No. ${candidate.number}`}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
