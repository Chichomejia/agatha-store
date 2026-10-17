export interface Receivable {
  id: string;
  saleId: string;
  clientName: string;
  clientPhone: string;
  total: number;
  paidTotal: number;
  balance: number;
  status: "open" | "paid";
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ReceivablePayment {
  id: string;
  amount: number;
  date: unknown;
  note?: string;
}
