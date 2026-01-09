import type { ObjectId } from "mongodb";

export type Candidate = {
  id: string; // Will be ObjectId string from MongoDB
  name: string;
  className: string; // e.g. "XI IPA 1"
  number: number; // Candidate number, e.g. 1, 2, 3
  vision: string;
  mission: string;
  photoUrl: string;
  votes: number;
};

export type Voter = {
  id: string; // Will be ObjectId string from MongoDB
  identifier: string; // A unique identifier for the voter, e.g., student ID
  hasVoted: boolean;
  votedAt?: Date;
  votedCandidateId?: ObjectId;
};
