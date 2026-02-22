
export interface Member {
    member_no: string;
    member_name: string;
    email: string;
    member_type: string;
    bdate: string; // Use Date if you parse dates, otherwise string
    addr_street1: string;
    tel_no: string;
    gender: string;
    membership_date: Date | string; // Use Date if you parse dates, otherwise string
    religion: string;
    mbr_tin_no: string;
    op_id: string;
    mbr_status: string;
    chapter: string;
}

export interface WebUser {
  memberNo: string;
  password: string;
  email: string;
  name: string;
  verified: boolean;
  token: string;
  remember_token: string
}

export interface NewWebUser {
  member_no: string;
  member_name: string;
  email: string;
  password: string;
  token: string;
  date_created: string | Date;
}

export interface CreditRights {
  username: string;
  rights: string;
}

export interface ElectionSetting {
  year: number;
  from: string;
  to: string;
  start: boolean;
}

export interface SystemConfigRow { uvalue: string};

export interface CandidatesResult {
  member_name: string;
  membership_date: Date | string;
  vision: string;
  photo_url: string;
  position_desc: string;
  position_id: string;
}