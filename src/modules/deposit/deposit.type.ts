export interface DepositDetail {
  member_no: string;
  deposit_type: string;
  tran_date: Date | string;
  tran_no: string;
  particulars: string;
  tran_type: string;
  amount: number;
  withdrawal: number;
  deposit: number;
  balance: Number;
}

export interface DepositHeader {
  member_no: string;
  deposit_type: string;
  beg_bal: number;
  beg_bal_dt: Date | string;
  balance: number;
  withdrawable: number;
  last_trn_date: Date | string;
  status: number;
  op_id: string;
  min_amt: number;
  max_amt: number;
  coltrl_amt: number;
  serial: string;
  deposit_desc: string;
}