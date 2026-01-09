"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash, CheckCircle, XCircle } from 'lucide-react';
import { addVoterTokens } from '@/lib/actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Voter } from '@/lib/types';

const formSchema = z.object({
  tokens: z.string().min(1, 'Daftar token tidak boleh kosong.'),
});

type FormValues = z.infer<typeof formSchema>;

interface VotersManagerProps {
  initialVoters: Voter[];
  onVotersUpdated: () => void;
}

export function VotersManager({ initialVoters, onVotersUpdated }: VotersManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voters, setVoters] = useState(initialVoters);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokens: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    const result = await addVoterTokens(data.tokens);

    if (result.success) {
      toast({
        title: 'Token Berhasil Diproses',
        description: `${result.added} token baru ditambahkan. ${result.duplicates} token duplikat dilewati.`,
      });
      form.reset();
      onVotersUpdated(); // Refresh the list from the parent
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal Menambah Token',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1">
        <Card className="bg-neutral-900 border-white/5">
          <CardHeader>
            <CardTitle>Tambah Token Pemilih</CardTitle>
            <CardDescription>
              Masukkan daftar token (misal: NISN), satu per baris. Token yang sudah ada akan dilewati.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="NISN12345&#10;NISN67890&#10;NISN54321"
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                     <UserPlus className="mr-2" />
                      Simpan Token
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="bg-neutral-900 border-white/5">
          <CardHeader>
            <CardTitle>Daftar Pemilih Terdaftar</CardTitle>
            <CardDescription>
              Total {voters.length} pemilih terdaftar di sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                <TableHeader className="sticky top-0 bg-neutral-900">
                    <TableRow className="border-b-white/10">
                    <TableHead>Token/Identifier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu Memilih</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {voters.map((voter) => (
                    <TableRow key={voter.id} className="border-b-white/5">
                        <TableCell className="font-mono">{voter.identifier}</TableCell>
                        <TableCell>
                        {voter.hasVoted ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                            <CheckCircle className="mr-1.5" size={14}/>
                            Sudah Memilih
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-orange-500/20 text-orange-400">
                            <XCircle className="mr-1.5" size={14}/>
                            Belum Memilih
                            </Badge>
                        )}
                        </TableCell>
                        <TableCell>
                        {voter.votedAt ? format(new Date(voter.votedAt), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
                 {voters.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        Belum ada token pemilih yang ditambahkan.
                    </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    