export interface LoanDetail {
  loan_id: string;
  tran_date: Date | string;
  tran_no: string;
  particulars: string;
  prin_payment: number;
  int_payment: number;
  fines_payment: number;
  balance: number;
}

export interface LoanHeader {
  loan_id: string;
  payments: number;
  loan_date: string | Date;
  loan_desc: string;
}

export interface LoanTypeDetail {
  loan_type: string;
  loan_desc: string;
}

export interface LoanType {
  loan_type: string;
  loan_desc: string;
  int_cd: string;
  fines_cd: string;
  op_id: string;
  term: number;
  int_rate: number;
  installment_type: number;
  service_fee: number;
  online_status: number;
  online_loan_limit: number;
  int_factor: number;
  loan_purpose: string;
  add_on_flag: string;
  int_type: string;
  class_code: string;
  tqry_name: string;
  inst_type_desc?: string;
}

export interface LoanApplicationData {
  loan_type: string;
  memberno: string;
  loanamount: string;
  purpose: string;
  term: string;
  intRate: string;
}

export interface SaveLoanResult {
  success: boolean;
  message: string;
}

export interface LoanAppDetail {
  loanType: string;
  loanPurpose: string;
  loanAmount: number;
  interestRate: number;
  term: number;
  installmentType: string;
  items: string;
}

export interface FinanceDetail {
  sssPagibig: number | null;
  healthInsurance: number | null;
  cashAdvance: number | null;
  netPay: number;
  highestAvailment: number;
  delinquencyHistory: string;
  overtime: number | null;
  cemimpcoDeduction: number | null;
  rank: string;
  basicSalary: number;
}

export interface PersonalDetail {
  employeeName: string | null;
  homeOwnership: string | null;
  homeAddress: string | null;
  position: string | null;
  yearsInCompany: number;  
  lineLeader: string | null;
  companyTelephone: string | null;
  spouse: string | null;
  spouseAddress: string | null;
  telephoneNumber: string | null;
}


export interface MemberRow {
  member_no: string;
  member_name: string;
  member_type: string;
  bdate: string | null;
  addr_street1: string | null;
  addr_street2: string | null;
  telno: string | null;
  email: string | null;
  gender: string | null;
  civ_stat: string | null;
  religion: string | null;
  mbr_tin_no: string | null;
  mbr_status: string | null;
  chapter: string;
  spouse: string | null;
}

export interface DelinquencyHistory {
  member_no: string;
  active_loans: number;
  delinquent_loans: number;
  is_delinquent: boolean;
}