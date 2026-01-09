"use client";

import { useState, type ReactNode } from "react";
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
import { Loader2 } from "lucide-react";
import { updateCandidate } from "@/lib/actions";
import type { Candidate } from "@/lib/types";

const candidateSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter."),
  className: z.string().min(1, "Kelas harus diisi."),
  number: z.coerce.number().min(1, "Nomor urut harus diisi."),
  vision: z.string().min(10, "Visi minimal 10 karakter."),
  mission: z.string().min(10, "Misi minimal 10 karakter."),
  photo: z
    .custom<FileList>()
    .refine((files) => files === undefined || files.length <= 1, "Hanya satu foto yang diperbolehkan.")
    .optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface EditCandidateDialogProps {
  children: ReactNode;
  candidate: Candidate;
  onCandidateUpdate: (updatedCandidate: Candidate) => void;
}

export function EditCandidateDialog({ children, candidate, onCandidateUpdate }: EditCandidateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: candidate.name,
      className: candidate.className,
      number: candidate.number,
      vision: candidate.vision,
      mission: candidate.mission,
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
    if (data.photo && data.photo[0]) {
        formData.append('photo', data.photo[0]);
    }

    const result = await updateCandidate(candidate.id, formData);

    if (result.success && result.updatedCandidate) {
      toast({
        title: "Data Kandidat Diperbarui!",
      });
      onCandidateUpdate(result.updatedCandidate);
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: result.message || "Terjadi kesalahan.",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Data Kandidat</DialogTitle>
          <DialogDescription>
            Perbarui detail untuk kandidat "{candidate.name}".
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
                    <FormLabel>Foto Baru (Opsional)</FormLabel>
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
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
