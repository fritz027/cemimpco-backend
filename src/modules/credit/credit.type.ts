export interface Store {
  store_id: string;
  store_name: string;
  store_address: string;
}

export interface Members {
  member_no: string;
  member_name: string;
}

export interface CreditPayload {
  username: string;
  password: string;
  memberNo?: string;
  phoneNo?: string;
  otp?:string;
  storeID?: string;
}

export interface CreditAvailedPayload {
  memberNo: string;
  referenceNo: string;
  storeID: string;
  amount: number;
  amountPaid?: number;
}