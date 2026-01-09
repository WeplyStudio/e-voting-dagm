"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

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

interface ResultsDisplayProps {
  initialCandidates: Candidate[];
}

export function ResultsDisplay({ initialCandidates }: ResultsDisplayProps) {
  const [candidates, setCandidates] = React.useState(initialCandidates);

  React.useEffect(() => {
    // Poll for new data every 5 seconds
    const interval = setInterval(async () => {
      const updatedCandidates = await getCandidates();
      setCandidates(updatedCandidates);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const chartData = candidates
    .map(c => ({
      name: `No. ${c.number}\n${c.name.split(' ')[0]}`,
      votes: c.votes,
      fill: `hsl(var(--chart-${c.number}))`,
    }))
    .sort((a, b) => b.votes - a.votes);

  const chartConfig = candidates.reduce((acc, c) => {
    acc[c.name] = {
      label: c.name,
      color: `hsl(var(--chart-${c.number}))`,
    };
    return acc;
  }, {} as any);

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline">Perolehan Suara Real-time</CardTitle>
        <CardDescription>Data diperbarui secara otomatis setiap 5 detik.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
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
  )
}
