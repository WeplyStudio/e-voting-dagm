"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle } from "lucide-react";
import { addCandidate } from "@/lib/actions";
import type { Candidate } from "@/lib/types";

const candidateSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter."),
  className: z.string().min(1, "Kelas harus diisi."),
  number: z.coerce.number().min(1, "Nomor urut harus diisi."),
  vision: z.string().min(10, "Visi minimal 10 karakter."),
  mission: z.string().min(10, "Misi minimal 10 karakter."),
  photo: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Foto kandidat harus diupload."),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface AddCandidateDialogProps {
  onCandidateAdded: (newCandidate: Candidate) => void;
}

export function AddCandidateDialog({ onCandidateAdded }: AddCandidateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      className: "",
      number: undefined,
      vision: "",
      mission: "",
      photo: undefined,
    },
  });

  async function onSubmit(data: CandidateFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('className', data.className);
    formData.append('number', String(data.number));
    formData.append('vision', data.vision);
    formData.append('mission', data.mission);
    if(data.photo?.[0]) {
        formData.append('photo', data.photo[0]);
    }

    const result = await addCandidate(formData);

    if (result.success) {
      toast({
        title: "Kandidat Berhasil Ditambahkan!",
      });
      // This is a bit of a hack, we don't get the full candidate object back
      // A full refresh or more complex state management would be better.
      // For now, we'll just close and let the parent re-fetch.
      // A better implementation would have `addCandidate` return the new candidate.
      window.location.reload(); 
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menambah Kandidat",
        description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2" />
            Tambah Kandidat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Tambah Kandidat Baru</DialogTitle>
          <DialogDescription>
            Isi detail untuk kandidat yang akan berpartisipasi dalam pemilihan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nomor Urut</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kelas</FormLabel>
                  <FormControl><Input placeholder="cth: XII IPA 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visi</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Misi</FormLabel>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>Foto Kandidat (JPG/PNG, maks 2MB)</FormLabel>
                    <FormControl>
                        <Input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Kandidat"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
