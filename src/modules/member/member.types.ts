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
    sms_cpno: string;
    credit_limit: number;
    credit_availed: number;

}

export interface MemberDeposits {
  description: string,
  balance: number,
  depositType: string, 
}

export interface MemberLoans {
  loanID: string;
  loanDate: Date | string;
  loanAmount: number;
  payments: number;
  interest: number;
  balance: number;
  description: string;
}

export interface MemberTimeDeposits {
  referenceNo: string;
  memberNo: string;
  depositDate: Date | string;
  term: number;
  dueDate: Date | string;
  depositAmount: number;
  interestRate: number;
  certificateNo: string;
  termStatus: string;
}

