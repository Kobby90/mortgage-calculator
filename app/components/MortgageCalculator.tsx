import React, { useState, useEffect } from 'react';
import './MortgageCalculator.css';
import * as XLSX from 'xlsx';

const formatCurrency = (value) => {
  if (!value) return '0.00';
  return Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const MortgageCalculator = () => {
  const [loanDetails, setLoanDetails] = useState({
    loanBalance: 1,
    interestRate: 1,
    downPayment: 0,
    arrangementFeeRate: 0,
    propertyInsuranceRate: 0,
    loanTerm: { years: 1, months: 0 },
    paymentFrequency: 'Monthly',
    firstPaymentDate: '2025-01-01'
  });

  const [results, setResults] = useState({
    monthlyPayment: 0,
    totalPayment: 0,
    totalInterest: 0,
    amortizationSchedule: []
  });

  const [showSchedule, setShowSchedule] = useState(true);
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateInputs = () => {
    const newErrors = {};
    
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
      const schedule = [];

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

  const InputField = ({ label, name, value, onChange, error, type = 'number' }) => {
    const handleChange = (e) => {
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

  const handleInputChange = (e) => {
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
        <div className="results-section">
          <div className="results-summary">
            <div className="result-item">
              <h3>Monthly Payment</h3>
              <h2>GHC {formatCurrency(results.monthlyPayment)}</h2>
            </div>
            <div className="result-item">
              <h3>Total Payment</h3>
              <h2>GHC {formatCurrency(results.totalPayment)}</h2>
            </div>
            <div className="result-item">
              <h3>Total Interest</h3>
              <h2>GHC {formatCurrency(results.totalInterest)}</h2>
            </div>
          </div>
          
          <div className="save-results-section">
            <div className="save-results-container">
              <button 
                className="save-button"
                onClick={generateAndDownloadExcel}
              >
                📩 Save Results
              </button>
              <div className="email-input-group">
                <input
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  className="send-button"
                  onClick={handleSaveResults}
                  disabled={isSubmitting}
                >
                  Send to Email
                </button>
              </div>
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  id="terms"
                />
                <label htmlFor="terms">
                  Please accept our <a href="#">Privacy Policy</a> and <a href="#">Terms and Conditions</a> to proceed.
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="calculator-grid">
          <div className="input-section">         
            <InputField
              label="Loan Balance"
              name="loanBalance"
              value={loanDetails.loanBalance}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                loanBalance: value
              }))}
              error={errors.loanBalance}
            />

            <InputField
              label="Interest Rate"
              name="interestRate"
              value={loanDetails.interestRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                interestRate: value
              }))}
              error={errors.interestRate}
            />

            <InputField
              label="Down Payment"
              name="downPayment"
              value={loanDetails.downPayment}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                downPayment: value
              }))}
              error={errors.downPayment}
            />

            <InputField
              label="Arrangement Fee Rate (%)"
              name="arrangementFeeRate"
              value={loanDetails.arrangementFeeRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                arrangementFeeRate: value
              }))}
              error={errors.arrangementFeeRate}
            />

            <InputField
              label="Property Insurance Rate (%)"
              name="propertyInsuranceRate"
              value={loanDetails.propertyInsuranceRate}
              onChange={(value) => setLoanDetails(prev => ({
                ...prev,
                propertyInsuranceRate: value
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

            <InputField
              label="Date of First Payment"
              name="firstPaymentDate"
              type="date"
              value={loanDetails.firstPaymentDate}
              onChange={(e) => setLoanDetails({...loanDetails, firstPaymentDate: e.target.value})}
              error={errors.firstPaymentDate}
            />

            <div className="payment-frequency">
              <label>Payment Frequency</label>
              <div className="frequency-buttons">
                {['Annually', 'Semi-annually', 'Quarterly', 'Monthly', 'Fortnightly'].map(freq => (
                  <button
                    key={freq}
                    className={loanDetails.paymentFrequency === freq ? 'active' : ''}
                    onClick={() => setLoanDetails({...loanDetails, paymentFrequency: freq})}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="results-section">
            {showSchedule && (
              <div className="amortization-schedule">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Due Date</th>
                      <th>Payment (GHC)</th>
                      <th>Principal (GHC)</th>
                      <th>Interest (GHC)</th>
                      <th>Balance (GHC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.amortizationSchedule.map((row) => (
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
    </div>
  );
};

export default MortgageCalculator; 