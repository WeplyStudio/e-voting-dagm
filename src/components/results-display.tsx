"use client"

import * as React from "react"
import Image from "next/image";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Candidate } from "@/lib/types";
import { getCandidates } from "@/lib/actions"
import { Award } from "lucide-react";

interface ResultsDisplayProps {
  initialCandidates: Candidate[];
}

const WinnerCard = ({ candidate, rank }: { candidate: Candidate, rank: number }) => {
    const rankColor = {
        1: "border-yellow-400 shadow-yellow-400/20",
        2: "border-slate-400 shadow-slate-400/20",
        3: "border-amber-600 shadow-amber-600/20"
    }[rank] || "border-border";

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 * rank, duration: 0.5, type: "spring", stiffness: 100 }}
            className={`relative flex flex-col items-center justify-end text-center p-6 bg-card border-2 rounded-2xl shadow-2xl ${rankColor}`}
        >
             <div className={`absolute -top-6 bg-card px-4 py-2 rounded-full border-2 ${rankColor}`}>
                <div className="flex items-center gap-2">
                    <Award size={20} className={
                        rank === 1 ? 'text-yellow-400' :
                        rank === 2 ? 'text-slate-400' :
                        'text-amber-600'
                    }/>
                    <span className="font-bold text-lg">Peringkat {rank}</span>
                </div>
            </div>
            <div className="relative w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-background">
                <Image
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    fill
                    className="object-cover"
                />
            </div>
            <h3 className="text-xl font-bold font-headline">{candidate.name}</h3>
            <p className="text-muted-foreground text-sm">{candidate.className}</p>
            <div className="mt-4 text-3xl font-bold text-primary">{candidate.votes.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Suara</p>
        </motion.div>
    );
};

export function ResultsDisplay({ initialCandidates }: ResultsDisplayProps) {
  const [candidates, setCandidates] = React.useState(initialCandidates);

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const updatedCandidates = await getCandidates();
      setCandidates(updatedCandidates);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sortedCandidates = React.useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);
  
  const winners = sortedCandidates.slice(0, 3);
  const otherCandidates = sortedCandidates.slice(3);

  const chartData = otherCandidates.map(c => ({
      name: `No. ${c.number} - ${c.name}`,
      votes: c.votes,
      fill: `hsl(var(--chart-${c.number > 5 ? (c.number % 5) + 1 : c.number}))`,
    }));

  const chartConfig = otherCandidates.reduce((acc, c) => {
    acc[c.name] = {
      label: c.name,
      color: `hsl(var(--chart-${c.number > 5 ? (c.number % 5) + 1 : c.number}))`,
    };
    return acc;
  }, {} as any);

  return (
    <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-end">
            {winners.length > 1 && <WinnerCard candidate={winners[1]} rank={2} />}
            {winners.length > 0 && <WinnerCard candidate={winners[0]} rank={1} />}
            {winners.length > 2 && <WinnerCard candidate={winners[2]} rank={3} />}
        </div>
        
        {otherCandidates.length > 0 && (
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline">Peringkat Lainnya</CardTitle>
                    <CardDescription>Data perolehan suara untuk kandidat lainnya, diperbarui setiap 5 detik.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
                        <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.split(' - ')[1] || value}
                        className="text-xs whitespace-pre-wrap"
                        />
                        <YAxis 
                            dataKey="votes"
                            allowDecimals={false}
                            tickMargin={10}
                        />
                        <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="votes" radius={8} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        )}
        {candidates.length === 0 && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Belum ada data suara yang masuk.</p>
            </div>
        )}
    </div>
  )
}
