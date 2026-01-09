
import { ResultsDisplay } from "@/components/results-display";
import { getCandidates, getVotingStatus, getShowResultsStatus } from "@/lib/actions";
import { BarChart, Lock } from "lucide-react";

export default async function ResultsPage() {
  const showResults = await getShowResultsStatus();
  const candidates = await getCandidates();
  
  if (!showResults) {
     return (
       <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Hasil Perolehan Suara</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Perhitungan suara pemilihan ketua OSIS.
            </p>
        </div>
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-medium">Hasil Suara Belum Dirilis</h3>
            <p className="mt-2 text-base text-muted-foreground">
              Hasil perolehan suara akan ditampilkan di sini setelah sesi voting selesai dan dikonfirmasi oleh admin.
            </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Hasil Perolehan Suara</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Perolehan suara final dari pemilihan ketua OSIS.
        </p>
      </div>
      <ResultsDisplay initialCandidates={candidates} />
    </div>
  );
}
