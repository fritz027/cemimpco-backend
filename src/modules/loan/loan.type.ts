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