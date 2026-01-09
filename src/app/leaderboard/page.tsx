
import { ResultsDisplay } from "@/components/results-display";
import { getCandidates, getShowResultsStatus } from "@/lib/actions";
import { Lock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function ResultsPage() {
  const showResults = await getShowResultsStatus();
  const candidates = await getCandidates();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
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
