export interface ElectionSetting {
  year: number;
  from: string;
  to: string;
  start: boolean;
}

export interface Position {
  position_id: string;
  position_desc: string;
  position: number;
}

export interface Candidate {
  candidate_id: string;
  elect_year: number;
  position_id: string;
  member_no: string;
  elec_order: number;
  vision: string;
  photo_url: string | null;
}

export interface CandidatesResult {
  candidate_id: string;
  elect_year: number;
  position_id: string;
  member_no: string;
  elec_order: number;
  vision: string;
  position_des: string;
  member_name: string;
  photo_url: string;

}

export interface CandidatePhotoRow {
  candidate_id: string;
  year: number;
  photo_url: string | null;
}

export interface Ballots {
  ballot_no: number;
  elect_year: number;
  member_no: string;
  vote_date: string | Date;
}

export interface MemberVoteCasted {
  candidate_id: string;
  candidate_member_no: string;
  candidate_name: string;
  vision: string;
  position_id: string;
  position_desc: string;
  photo_url: string;
}

export interface ElectionResults {
  votes: number;
  elect_year: number;
  candidate_id: string;
  member_no: string;
  member_name: string;
  position_id: string;
  position_desc: string;
  photo_url: string;
}
