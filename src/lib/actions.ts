
"use server";

import { z } from "zod";
import { getCandidatesCollection, getVotersCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Candidate, Voter } from "./types";


function revalidateAll() {
    revalidatePath("/", "layout");
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

function docToVoter(doc: any): Voter {
    if (!doc) return doc;
    const { _id, votedCandidateId, ...rest } = doc;
    
    return {
        ...rest,
        id: _id.toString(),
        hasVoted: doc.hasVoted || false,
        votedCandidateId: votedCandidateId ? votedCandidateId.toString() : undefined,
    } as Voter;
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

        const result = await collection.insertOne({
            ...parsed.data,
            photoUrl: photoUrl,
            votes: 0,
            createdAt: new Date(),
        });
        
        const newCandidate = await collection.findOne({_id: result.insertedId});

        revalidateAll();
        return { success: true, newCandidate: docToCandidate(newCandidate) };
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
        
        const existingWithNumber = await collection.findOne({ number: parsed.data.number, _id: { $ne: new ObjectId(candidateId) } });
        if (existingWithNumber) {
            return { success: false, message: `Nomor urut ${parsed.data.number} sudah digunakan oleh kandidat lain.` };
        }
        
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
    if (!ObjectId.isValid(candidateId)) {
        return { success: false, message: "ID Kandidat tidak valid." };
    }
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
  voterIdentifier: z.string().min(1, "Pengenal pemilih tidak boleh kosong."),
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
        const sessionId = await getVotingSessionId();

        const voter = await voters.findOne({ identifier: voterIdentifier, sessionId });
        
        if (voter && voter.hasVoted) {
            return { success: false, message: 'Anda sudah pernah memberikan suara dari perangkat ini.', votedCandidateId: voter.votedCandidateId?.toString() };
        }
        
        await voters.updateOne(
            { identifier: voterIdentifier },
            { $set: { hasVoted: true, votedAt: new Date(), votedCandidateId: new ObjectId(candidateId), sessionId: sessionId } },
            { upsert: true }
        );
        
        const candidates = await getCandidatesCollection();
        await candidates.updateOne(
            { _id: new ObjectId(candidateId) },
            { $inc: { votes: 1 } }
        );
        
        revalidateAll();
        return { success: true };

    } catch (error) {
        console.error("Gagal memberikan suara:", error);
        return { success: false, message: 'Terjadi kesalahan pada server.' };
    }
}

// --- Voter Status Management ---

export async function getVoterStatus(identifier: string) {
    if (!identifier) {
        return { hasVoted: false };
    }
    try {
        const voters = await getVotersCollection();
        const voter = await voters.findOne({ identifier: identifier });

        if (!voter) {
            return { hasVoted: false, message: "Pemilih belum tercatat" };
        }

        return { 
            hasVoted: voter.hasVoted,
            votedCandidateId: voter.votedCandidateId?.toString() || null,
        };
    } catch (error) {
        return { hasVoted: false, message: "Error saat memeriksa status pemilih" };
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

export async function getVotingSessionId(): Promise<string> {
    return getSetting("votingSessionId", "default-session");
}

export async function resetAllVotes() {
    try {
        const candidates = await getCandidatesCollection();
        await candidates.updateMany({}, { $set: { votes: 0 } });
        
        const newSessionId = `session_${Date.now()}`;
        await setSetting("votingSessionId", newSessionId);
        
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal mereset suara:", error);
        return { success: false, message: "Gagal mereset semua data suara." };
    }
}

export async function resetAllData() {
    try {
        const candidates = await getCandidatesCollection();
        await candidates.deleteMany({});
        
        const voters = await getVotersCollection();
        await voters.deleteMany({});
        
        const settings = await getSettingsCollection();
        await settings.deleteMany({});
        
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal mereset semua data:", error);
        return { success: false, message: "Gagal mereset semua data pemilihan." };
    }
}
