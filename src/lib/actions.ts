"use server";

import { z } from "zod";
import { getCandidatesCollection, getVotersCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Candidate } from "./types";
import imageCompression from 'browser-image-compression';


function revalidateAll() {
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/results");
}

function docToCandidate(doc: any): Candidate {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    
    return {
        ...rest,
        id: _id.toString(),
        votes: doc.votes || 0,
    } as Candidate;
}

// --- Candidate Management ---

export async function getCandidates(): Promise<Candidate[]> {
    const collection = await getCandidatesCollection();
    const candidatesFromDb = await collection.find({}).sort({ number: 1 }).toArray();
    return candidatesFromDb.map(docToCandidate);
}

const candidateSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter."),
  className: z.string().min(1, "Kelas harus diisi."),
  number: z.coerce.number().min(1, "Nomor urut harus diisi."),
  vision: z.string().min(10, "Visi minimal 10 karakter."),
  mission: z.string().min(10, "Misi minimal 10 karakter."),
});

async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}


export async function addCandidate(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parsed = candidateSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, message: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const photoFile = formData.get('photo') as File | null;
    if (!photoFile || photoFile.size === 0) {
        return { success: false, message: 'Foto kandidat harus diunggah.' };
    }
     if (photoFile.size > 2 * 1024 * 1024) { // 2MB limit on server
      return { success: false, message: 'Ukuran foto maksimal 2MB.' };
    }
    if (!['image/png', 'image/jpeg'].includes(photoFile.type)) {
      return { success: false, message: 'Format foto harus PNG atau JPG.' };
    }

    try {
        const collection = await getCandidatesCollection();

        const existingCandidate = await collection.findOne({ number: parsed.data.number });
        if (existingCandidate) {
            return { success: false, message: `Nomor urut ${parsed.data.number} sudah digunakan.` };
        }

        const photoUrl = await fileToDataUri(photoFile);

        await collection.insertOne({
            ...parsed.data,
            photoUrl: photoUrl,
            votes: 0,
            createdAt: new Date(),
        });

        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal menambah kandidat:", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}

export async function updateCandidate(candidateId: string, formData: FormData) {
    if (!ObjectId.isValid(candidateId)) {
        return { success: false, message: "ID Kandidat tidak valid." };
    }
    
    const rawData = Object.fromEntries(formData.entries());
    const parsed = candidateSchema.safeParse(rawData);

     if (!parsed.success) {
        return { success: false, message: parsed.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const collection = await getCandidatesCollection();
        const updateData: any = { ...parsed.data };
        
        const photoFile = formData.get('photo') as File | null;
        if (photoFile && photoFile.size > 0) {
            if (photoFile.size > 2 * 1024 * 1024) { // 2MB limit
                return { success: false, message: 'Ukuran foto maksimal 2MB.' };
            }
            updateData.photoUrl = await fileToDataUri(photoFile);
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(candidateId) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        revalidateAll();
        return { success: true, updatedCandidate: docToCandidate(result) };
    } catch (error) {
        console.error("Gagal memperbarui kandidat:", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}


export async function deleteCandidate(candidateId: string) {
    try {
        const collection = await getCandidatesCollection();
        await collection.deleteOne({ _id: new ObjectId(candidateId) });
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal menghapus kandidat:", error);
        return { success: false, message: 'Gagal menghapus kandidat.' };
    }
}


// --- Voting Logic ---

const voteSchema = z.object({
  candidateId: z.string().refine(id => ObjectId.isValid(id)),
  voterIdentifier: z.string().min(1, "Token pemilih tidak boleh kosong."),
});

export async function castVote(formData: FormData) {
    const isVotingOpen = await getVotingStatus();
    if (!isVotingOpen) {
        return { success: false, message: "Sesi voting saat ini ditutup." };
    }

    const rawData = Object.fromEntries(formData.entries());
    const parsed = voteSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, message: 'Data vote tidak valid.' };
    }
    
    const { candidateId, voterIdentifier } = parsed.data;

    try {
        const voters = await getVotersCollection();

        // Check if voter has already voted
        const existingVoter = await voters.findOne({ identifier: voterIdentifier });
        if (existingVoter) {
            return { success: false, message: 'Token ini sudah digunakan untuk memilih.' };
        }

        // Add to voters collection to mark as voted
        await voters.insertOne({
            identifier: voterIdentifier,
            hasVoted: true,
            votedAt: new Date(),
        });
        
        // Increment candidate's vote count
        const candidates = await getCandidatesCollection();
        await candidates.updateOne(
            { _id: new ObjectId(candidateId) },
            { $inc: { votes: 1 } }
        );
        
        revalidatePath("/results");
        return { success: true };

    } catch (error) {
        console.error("Gagal memberikan suara:", error);
        return { success: false, message: 'Terjadi kesalahan pada server.' };
    }
}

// --- Global Settings ---

async function getSetting(key: string, defaultValue: any) {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key });
        return config ? config.value : defaultValue;
    } catch (error) {
        console.error(`Gagal mengambil pengaturan ${key}:`, error);
        return defaultValue;
    }
}

async function setSetting(key: string, value: any) {
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key },
            { $set: { value } },
            { upsert: true }
        );
        revalidateAll();
        return { success: true, newState: value };
    } catch (error) {
        console.error(`Gagal mengubah pengaturan ${key}:`, error);
        return { success: false, message: `Gagal mengubah pengaturan ${key}.` };
    }
}

export async function getVotingStatus(): Promise<boolean> {
    return getSetting("votingOpen", false);
}

export async function setVotingStatus(isOpen: boolean) {
    return setSetting("votingOpen", isOpen);
}

export async function getShowResultsStatus(): Promise<boolean> {
    return getSetting("showResults", false);
}

export async function setShowResultsStatus(show: boolean) {
    return setSetting("showResults", show);
}


export async function resetAllVotes() {
    try {
        const candidates = await getCandidatesCollection();
        await candidates.updateMany({}, { $set: { votes: 0 } });

        const voters = await getVotersCollection();
        await voters.deleteMany({});
        
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal mereset suara:", error);
        return { success: false, message: "Gagal mereset semua data suara." };
    }
}
