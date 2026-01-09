"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { getCandidates, getVotingStatus, getShowResultsStatus } from "@/lib/actions";
import { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_PASSWORD = "osis-keren-2024";
const AUTH_COOKIE_NAME = "admin-authenticated";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [votingStatus, setVotingStatus] = useState<boolean | null>(null);
  const [showResultsStatus, setShowResultsStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        password: "",
    },
  });

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (cookie?.split('=')[1] === 'true') {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        getCandidates(),
        getVotingStatus(),
        getShowResultsStatus(),
      ]).then(([candidatesData, votingStatusData, showResultsData]) => {
            setCandidates(candidatesData);
            setVotingStatus(votingStatusData);
            setShowResultsStatus(showResultsData);
            setLoading(false);
      }).catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Gagal memuat data' });
            setLoading(false);
      });
    }
  }, [isAuthenticated, toast]);


  function onSubmit(data: LoginFormValues) {
    if (data.password === ADMIN_PASSWORD) {
      toast({ title: "Login Berhasil", description: "Selamat datang, Admin!" });
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=604800`;
      setIsAuthenticated(true);
    } else {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
      });
      form.reset();
    }
  }
  
  function handleLogout() {
    toast({ title: "Logout Berhasil" });
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    setIsAuthenticated(false);
    setCandidates(null);
    setVotingStatus(null);
    setShowResultsStatus(null);
    setLoading(false);
  }

  if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
          <div className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      );
  }
  
  if (isAuthenticated && candidates !== null && votingStatus !== null && showResultsStatus !== null) {
    return <AdminDashboard
        initialCandidates={candidates} 
        initialVotingStatus={votingStatus} 
        initialShowResultsStatus={showResultsStatus}
        onLogout={handleLogout}
    />;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline mt-4">Login Dasbor Admin</CardTitle>
          <CardDescription>Masukkan kata sandi untuk mengakses dasbor pemilihan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Masuk
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
