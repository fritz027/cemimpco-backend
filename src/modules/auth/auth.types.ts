
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
  member_no: string;
  password: string;
  email: string;
  name: string;
  verified: string;
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