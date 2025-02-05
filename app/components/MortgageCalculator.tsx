import React, { useState, useEffect } from 'react';
import './MortgageCalculator.css';
import * as XLSX from 'xlsx';

interface LoanDetails {
  loanBalance: number;
  interestRate: number;
  downPayment: number;
  arrangementFeeRate: number;
  propertyInsuranceRate: number;
  loanTerm: { years: number; months: number };
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  firstPaymentDate: string;
}

interface Errors {
  loanBalance?: string;
  interestRate?: string;
  downPayment?: string;
  arrangementFeeRate?: string;
  propertyInsuranceRate?: string;
  loanTerm?: string;
  firstPaymentDate?: string;
}

interface CalculationResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

interface AmortizationRow {
  period: number;
  date: string;
  payment: string;
  principalPaid: string;
  interest: string;
  balance: string;
  isInitialFee: boolean;
  feeBreakdown: {
    arrangementFee: string;
    propertyInsurance: string;
  };
}

interface InputFieldProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
  type?: string;
}

const formatCurrency = (value: number): string => {
  if (!value) return '0.00';
  return Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const MortgageCalculator = () => {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanBalance: 1,
    interestRate: 1,
    downPayment: 0,
    arrangementFeeRate: 0,
    propertyInsuranceRate: 0,
    loanTerm: { years: 1, months: 0 },
    paymentFrequency: 'monthly',
    firstPaymentDate: '2025-01-01'
  });

  const [results, setResults] = useState<CalculationResults | null>(null);

  const [showSchedule, setShowSchedule] = useState(true);
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateInputs = () => {
    const newErrors: Errors = {};
    
    if (!loanDetails.loanBalance || loanDetails.loanBalance <= 0)
      newErrors.loanBalance = 'Loan balance must be greater than 0';
    
    if (!loanDetails.interestRate || loanDetails.interestRate <= 0)
      newErrors.interestRate = 'Interest rate must be greater than 0';
    
    if (loanDetails.downPayment < 0)
      newErrors.downPayment = 'Down payment cannot be negative';
    
    if (loanDetails.downPayment >= loanDetails.loanBalance)
      newErrors.downPayment = 'Down payment cannot exceed loan amount';
    
    if (loanDetails.arrangementFeeRate < 0)
      newErrors.arrangementFeeRate = 'Arrangement fee rate cannot be negative';
    
    if (loanDetails.propertyInsuranceRate < 0)
      newErrors.propertyInsuranceRate = 'Property insurance rate cannot be negative';
    
    if (loanDetails.loanTerm.years === 0 && loanDetails.loanTerm.months === 0)
      newErrors.loanTerm = 'Loan term must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMortgage = () => {
    if (!validateInputs()) {
      return;
    }
    setIsSubmitting(true);
    
    try {
      const principal = loanDetails.loanBalance - loanDetails.downPayment;
      const monthlyRate = loanDetails.interestRate / 100 / 12;
      const totalMonths = (loanDetails.loanTerm.years * 12) + loanDetails.loanTerm.months;
      
      // Calculate one-time fees
      const arrangementFee = (loanDetails.arrangementFeeRate / 100) * principal;
      const propertyInsurance = (loanDetails.propertyInsuranceRate / 100) * principal;
      
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) 
                            / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      
      const totalPayment = (monthlyPayment * totalMonths) + arrangementFee + propertyInsurance;
      const totalInterest = (monthlyPayment * totalMonths) - principal;

      // Generate amortization schedule
      let balance = principal;
      const schedule: AmortizationRow[] = [];

      // Add initial fees as first entry
      if (arrangementFee > 0 || propertyInsurance > 0) {
        schedule.push({
          period: 0,
          date: new Date(loanDetails.firstPaymentDate).toLocaleDateString(),
          payment: (arrangementFee + propertyInsurance).toFixed(2),
          principalPaid: '0.00',
          interest: '0.00',
          balance: balance.toFixed(2),
          isInitialFee: true,
          feeBreakdown: {
            arrangementFee: arrangementFee.toFixed(2),
            propertyInsurance: propertyInsurance.toFixed(2)
          }
        });
      }

      // Regular payment schedule
      for (let i = 1; i <= totalMonths; i++) {
        const interest = balance * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        balance -= principalPaid;

        schedule.push({
          period: i,
          date: new Date(loanDetails.firstPaymentDate).toLocaleDateString(),
          payment: monthlyPayment.toFixed(2),
          principalPaid: principalPaid.toFixed(2),
          interest: interest.toFixed(2),
          balance: Math.max(0, balance).toFixed(2)
        });
      }

      setResults({
        monthlyPayment: monthlyPayment.toFixed(2),
        totalPayment: totalPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        amortizationSchedule: schedule
      });
    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ calculation: 'Error calculating mortgage details' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    calculateMortgage();
  }, [loanDetails]);

  const InputField: React.FC<InputFieldProps> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    error, 
    type = 'number' 
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (type === 'number') {
        // Only update if it's a valid number or empty
        if (newValue === '' || !isNaN(newValue)) {
          onChange(newValue === '' ? 0 : parseFloat(newValue));
        }
      } else {
        onChange(newValue);
      }
    };

    return (
      <div className="input-group">
        <label>{label}</label>
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={handleChange}
          className={error ? 'error' : ''}
          min="0"
          step="any"
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateAndDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    const summaryData = [
      ['Mortgage Summary'],
      ['Monthly Payment', `GHC ${formatCurrency(results.monthlyPayment)}`],
      ['Total Payment', `GHC ${formatCurrency(results.totalPayment)}`],
      ['Total Interest', `GHC ${formatCurrency(results.totalInterest)}`],
      [],
      ['Loan Details'],
      ['Loan Balance', `GHC ${formatCurrency(loanDetails.loanBalance)}`],
      ['Interest Rate', `${loanDetails.interestRate}%`],
      ['Arrangement Fee Rate', `${loanDetails.arrangementFeeRate}%`],
      ['Property Insurance Rate', `${loanDetails.propertyInsuranceRate}%`],
      ['Down Payment', `GHC ${formatCurrency(loanDetails.downPayment)}`],
      ['Loan Term', `${loanDetails.loanTerm.years} years ${loanDetails.loanTerm.months} months`],
      ['Payment Frequency', loanDetails.paymentFrequency],
      ['First Payment Date', loanDetails.firstPaymentDate]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create amortization schedule sheet
    const scheduleHeaders = ['Period', 'Date', 'Payment', 'Principal', 'Interest', 'Remaining Balance'];
    const scheduleData = [scheduleHeaders];
    
    results.amortizationSchedule.forEach(row => {
      scheduleData.push([
        row.period,
        row.date,
        row.payment,
        row.principalPaid,
        row.interest,
        row.balance
      ]);
    });
    
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Amortization Schedule');
    
    // Download the file
    XLSX.writeFile(workbook, 'mortgage-calculation.xlsx');
  };

  const handleSaveResults = async () => {
    if (!email || !acceptTerms) {
      setErrors({
        ...errors,
        email: !email ? 'Email is required' : '',
        terms: !acceptTerms ? 'Please accept the terms and conditions' : ''
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate Excel file
      const workbook = XLSX.utils.book_new();
      
      // Create summary sheet
      const summaryData = [
        ['Mortgage Summary'],
        ['Monthly Payment', `GHC ${formatCurrency(results.monthlyPayment)}`],
        ['Total Payment', `GHC ${formatCurrency(results.totalPayment)}`],
        ['Total Interest', `GHC ${formatCurrency(results.totalInterest)}`],
        [],
        ['Loan Details'],
        ['Loan Balance', `GHC ${formatCurrency(loanDetails.loanBalance)}`],
        ['Interest Rate', `${loanDetails.interestRate}%`],
        ['Arrangement Fee Rate', `${loanDetails.arrangementFeeRate}%`],
        ['Property Insurance Rate', `${loanDetails.propertyInsuranceRate}%`],
        ['Down Payment', `GHC ${formatCurrency(loanDetails.downPayment)}`],
        ['Loan Term', `${loanDetails.loanTerm.years} years ${loanDetails.loanTerm.months} months`],
        ['Payment Frequency', loanDetails.paymentFrequency],
        ['First Payment Date', loanDetails.firstPaymentDate]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Download the file
      XLSX.writeFile(workbook, 'mortgage-calculation.xlsx');
      
      // Show success message
      alert(`Excel file has been generated and downloaded.\nIn a production environment, this would be emailed to: ${email}`);
      
      // Reset form
      setEmail('');
      setAcceptTerms(false);
      setErrors({});
    } catch (error) {
      console.error('Error generating Excel:', error);
      setErrors({ ...errors, submit: 'Failed to generate results. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mortgage-calculator">
      <div className="calculator-container">
        {results && (
          <div className="results-summary">
            <div className="result-item">
              <h3>Monthly Payment</h3>
              <h2>{formatCurrency(results.monthlyPayment)}</h2>
            </div>
            <div className="result-item">
              <h3>Total Payment</h3>
              <h2>{formatCurrency(results.totalPayment)}</h2>
            </div>
            <div className="result-item">
              <h3>Total Interest</h3>
              <h2>{formatCurrency(results.totalInterest)}</h2>
            </div>
          </div>
        )}

        <div className="calculator-grid">
          <div className="input-section">
            <InputField
              label="Loan Balance ($)"
              name="loanBalance"
              value={loanDetails.loanBalance}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                loanBalance: Number(value)
              }))}
              error={errors.loanBalance}
            />

            <InputField
              label="Interest Rate (%)"
              name="interestRate"
              value={loanDetails.interestRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                interestRate: Number(value)
              }))}
              error={errors.interestRate}
            />

            <InputField
              label="Down Payment ($)"
              name="downPayment"
              value={loanDetails.downPayment}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                downPayment: Number(value)
              }))}
              error={errors.downPayment}
            />

            <InputField
              label="Arrangement Fee Rate (%)"
              name="arrangementFeeRate"
              value={loanDetails.arrangementFeeRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                arrangementFeeRate: Number(value)
              }))}
              error={errors.arrangementFeeRate}
            />

            <InputField
              label="Property Insurance Rate (%)"
              name="propertyInsuranceRate"
              value={loanDetails.propertyInsuranceRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                propertyInsuranceRate: Number(value)
              }))}
              error={errors.propertyInsuranceRate}
            />

            <div className="loan-term-group">
              <label>Loan Term</label>
              <div className="loan-term-inputs">
                <div className="term-input">
                  <input
                    type="number"
                    value={loanDetails.loanTerm.years}
                    onChange={(e) => setLoanDetails({
                      ...loanDetails,
                      loanTerm: { ...loanDetails.loanTerm, years: Number(e.target.value) }
                    })}
                    min="0"
                  />
                  <span>years</span>
                </div>
                <div className="term-input">
                  <input
                    type="number"
                    value={loanDetails.loanTerm.months}
                    onChange={(e) => setLoanDetails({
                      ...loanDetails,
                      loanTerm: { ...loanDetails.loanTerm, months: Number(e.target.value) }
                    })}
                    min="0"
                    max="11"
                  />
                  <span>months</span>
                </div>
              </div>
              {errors.loanTerm && <span className="error-message">{errors.loanTerm}</span>}
            </div>

            <div className="input-group">
              <label>First Payment Date</label>
              <input
                type="date"
                value={loanDetails.firstPaymentDate}
                onChange={(e) => setLoanDetails({...loanDetails, firstPaymentDate: e.target.value})}
                error={errors.firstPaymentDate}
              />
            </div>

            <div className="payment-frequency">
              <label>Payment Frequency</label>
              <div className="frequency-buttons">
                <button
                  className={loanDetails.paymentFrequency === 'monthly' ? 'active' : ''}
                  onClick={() => setLoanDetails({...loanDetails, paymentFrequency: 'monthly'})}
                >
                  Monthly
                </button>
                <button
                  className={loanDetails.paymentFrequency === 'biweekly' ? 'active' : ''}
                  onClick={() => setLoanDetails({...loanDetails, paymentFrequency: 'biweekly'})}
                >
                  Bi-weekly
                </button>
                <button
                  className={loanDetails.paymentFrequency === 'weekly' ? 'active' : ''}
                  onClick={() => setLoanDetails({...loanDetails, paymentFrequency: 'weekly'})}
                >
                  Weekly
                </button>
              </div>
            </div>

            <button
              className="save-button"
              onClick={calculateMortgage}
            >
              Calculate
            </button>
          </div>

          {results && (
            <div className="amortization-schedule">
              <h3>Amortization Schedule</h3>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.amortizationSchedule.map(row => (
                    <tr key={row.period}>
                      <td>{row.period}</td>
                      <td>{row.date}</td>
                      <td>{row.payment}</td>
                      <td>{row.principalPaid}</td>
                      <td>{row.interest}</td>
                      <td>{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator; 