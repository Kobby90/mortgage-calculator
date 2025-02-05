export interface LoanDetails {
  loanBalance: number;
  interestRate: number;
  downPayment: number;
  arrangementFeeRate: number;
  propertyInsuranceRate: number;
  loanTerm: {
    years: number;
    months: number;
  };
  paymentFrequency: string;
  firstPaymentDate: string;
}

export interface CalculationResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: Array<{
    period: number;
    date: string;
    payment: string;
    principalPaid: string;
    interest: string;
    balance: string;
    isInitialFee?: boolean;
    feeBreakdown?: {
      arrangementFee: string;
      propertyInsurance: string;
    };
  }>;
}

export interface InputFieldProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: any) => void;
  error?: string;
  type?: string;
} 