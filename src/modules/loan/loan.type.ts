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