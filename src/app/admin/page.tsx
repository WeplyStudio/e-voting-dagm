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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { getCandidates, getVotingStatus, getShowResultsStatus, getVoters } from "@/lib/actions";
import { Candidate, Voter } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_PASSWORD = "osis-keren-2024";
const AUTH_COOKIE_NAME = "admin-authenticated";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [voters, setVoters] = useState<Voter[] | null>(null);
  const [votingStatus, setVotingStatus] = useState<boolean | null>(null);
  const [showResultsStatus, setShowResultsStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        password: "",
        rememberMe: true,
    },
  });

  useEffect(() => {
    const checkAuthCookie = () => {
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));
        if (cookie?.split('=')[1] === 'true') {
          setIsAuthenticated(true);
        } else {
          setLoading(false); // Only stop loading if not authenticated
        }
    };
    checkAuthCookie();
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        getCandidates(),
        getVoters(),
        getVotingStatus(),
        getShowResultsStatus(),
      ]).then(([candidatesData, votersData, votingStatusData, showResultsData]) => {
            setCandidates(candidatesData);
            setVoters(votersData);
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
      const cookieOptions = data.rememberMe 
        ? `path=/; max-age=604800` // 7 days
        : `path=/;`; // Session cookie
      document.cookie = `${AUTH_COOKIE_NAME}=true; ${cookieOptions}`;
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
    setVoters(null);
    setVotingStatus(null);
    setShowResultsStatus(null);
    // No need to set loading, will go back to login form
  }

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-[80vh] w-[90vw] rounded-2xl" />
        </div>
      );
  }
  
  if (isAuthenticated && candidates !== null && voters !== null && votingStatus !== null && showResultsStatus !== null) {
    return <AdminDashboard
        initialCandidates={candidates}
        initialVoters={voters}
        initialVotingStatus={votingStatus} 
        initialShowResultsStatus={showResultsStatus}
        onLogout={handleLogout}
    />;
  }

  return (
    <div className="flex items-center justify-center py-12 min-h-screen">
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
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Ingat saya
                      </FormLabel>
                    </div>
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
