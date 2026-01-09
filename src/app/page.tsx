import { CandidateList } from "@/components/candidate-list";
import { getCandidates, getVotingStatus } from "@/lib/actions";
import { Vote, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const isVotingOpen = await getVotingStatus();
  const candidates = await getCandidates();

  return (
    <div className="space-y-16">
      <section id="hero" className="text-center py-20">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">
          E-Voting Pemilihan OSIS
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
          Gunakan suaramu untuk memilih pemimpin masa depan. Setiap suara berarti untuk sekolah yang lebih baik.
        </p>
        <div className="mt-10">
          <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            <Link href="#candidates">
              <Vote className="mr-2" />
              Lihat Kandidat
            </Link>
          </Button>
        </div>
      </section>
      
      <section id="candidates">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-headline text-primary">Daftar Kandidat</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Kenali para kandidat, pelajari visi dan misi mereka sebelum memilih.</p>
        </div>
        
        {isVotingOpen ? (
          <CandidateList initialCandidates={candidates} />
        ) : (
          <Card className="w-full max-w-2xl mx-auto text-center py-16 bg-card/50">
            <CardHeader>
               <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                  <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="font-headline text-2xl">Voting Belum Dibuka</CardTitle>
              <CardDescription>
                Sesi pemilihan belum dimulai atau sudah berakhir. Silakan kembali lagi nanti atau lihat hasil suara jika sudah tersedia.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                  <Link href="/results">Lihat Hasil Akhir</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
