'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import SearchableSelect from '@/components/SearchableSelect';
import RechargeBrandingFooter from '@/components/recharge/RechargeBrandingFooter';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  metadata: any;
  kwikapi_opid?: number;
}

interface Circle {
  id: string;
  circle_code: string;
  circle_name: string;
}

interface BillDetails {
  consumer_name: string;
  bill_number: string;
  bill_date: string;
  bill_period: string;
  bill_amount: string;
  due_amount: string;
  due_date: string;
  ref_id: string;
}

interface FieldOption {
  value: string;
  label: string;
}

interface DynamicField {
  key: string;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
  type: string;
  kwikapi_param: string;
  description: string;
  options: FieldOption[];
}

export default function ElectricityBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);

  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');

  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Dynamic fields for different operators
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});

  // Two-step process state
  const [currentStep, setCurrentStep] = useState(1);
  const [operatorSelected, setOperatorSelected] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
    fetchCircles();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch('/api/wallet/balance');
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/recharge/operators?service_type=ELECTRICITY');
      const data = await res.json();
      if (data.success) {
        setOperators(data.data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchCircles = async () => {
    try {
      const res = await fetch('/api/recharge/circles');
      const data = await res.json();
      if (data.success) {
        setCircles(data.data);
      }
    } catch (error) {
      console.error('Error fetching circles:', error);
    }
  };

  const fetchBillerDetails = async (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator?.kwikapi_opid) {
      console.log('🔧 [Biller Details] No KwikAPI opid found for operator:', operator);
      return;
    }

    console.log('🔧 [Biller Details] Fetching details for operator:', operator.operator_name, 'opid:', operator.kwikapi_opid);

    try {
      const res = await fetch('/api/kwikapi/biller-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opid: operator.kwikapi_opid }),
      });

      const data = await res.json();
      console.log('🔧 [Biller Details] API Response:', data);

      if (data.success && data.data) {
        console.log('🔧 [Biller Details] Parameters from API:', data.data.parameters);

        // Process parameters and create dynamic fields
        const processedFields: DynamicField[] = [];

        // Process parameters from API response
        if (data.data.parameters && Array.isArray(data.data.parameters) && data.data.parameters.length > 0) {
          console.log('🔧 [Biller Details] Processing API parameters:', data.data.parameters);

          data.data.parameters.forEach((apiParam: any, index: number) => {
            const paramName = apiParam.name || apiParam.label;
            const paramLabel = apiParam.label || apiParam.name;
            const kwikApiParam = apiParam.kwikapi_param;

            console.log(`🔧 [Biller Details] Processing param ${index}:`, { paramName, paramLabel, kwikApiParam });

            if (paramName && paramLabel && kwikApiParam) {
              let fieldConfig: DynamicField = {
                key: `param_${index + 1}`,
                name: paramName,
                label: paramLabel,
                placeholder: `Enter ${paramLabel.toLowerCase()}`,
                required: true,
                order: index + 1,
                type: 'text',
                kwikapi_param: kwikApiParam,
                description: `Required parameter: ${paramLabel}`,
                options: [] as FieldOption[]
              };

              // Special handling for different field types
              if (paramName.toLowerCase().includes('city') || paramLabel.toLowerCase().includes('city')) {
                // City field should be a dropdown for Torrent Power
                if (operator.operator_name.includes('Torrent Power')) {
                  fieldConfig.type = 'select';
                  fieldConfig.placeholder = 'Select your city';
                  fieldConfig.options = [
                    { value: 'Ahmedabad', label: 'Ahmedabad' },
                    { value: 'Agra', label: 'Agra' },
                    { value: 'Surat', label: 'Surat' },
                    { value: 'Bhiwandi', label: 'Bhiwandi' },
                    { value: 'Shilmumbrakalwa', label: 'Shilmumbrakalwa' },
                  ] as FieldOption[];
                } else {
                  // For other operators, keep as text input
                  fieldConfig.type = 'text';
                  fieldConfig.placeholder = 'Enter your city';
                }
              } else if (paramName.toLowerCase().includes('service number') ||
                paramName.toLowerCase().includes('consumer number') ||
                paramName.toLowerCase().includes('account number') ||
                paramName.toLowerCase().includes('mobile number')) {
                // These should always be text inputs
                fieldConfig.type = 'text';
                fieldConfig.placeholder = `Enter ${paramLabel.toLowerCase()}`;
              }

              processedFields.push(fieldConfig);
            }
          });
        } else {
          console.log('🔧 [Biller Details] No parameters found in API response, using fallback');
          // Fallback: Add consumer number field
          processedFields.push({
            key: 'consumer_number',
            name: 'Consumer Number',
            label: 'Consumer Number / Meter ID',
            placeholder: 'Enter consumer/meter number from your electricity bill',
            required: true,
            order: 0,
            type: 'text',
            kwikapi_param: 'number',
            description: 'Your electricity bill consumer number or meter ID',
            options: [] as FieldOption[]
          });

          // Special handling for Torrent Power - add city field
          if (operator.operator_name.includes('Torrent Power')) {
            console.log('🔧 [Biller Details] Adding Torrent Power city field in fallback');
            processedFields.push({
              key: 'city',
              name: 'City',
              label: 'City',
              placeholder: 'Select your city',
              required: true,
              order: 1,
              type: 'select',
              kwikapi_param: 'opt1',
              description: 'Select your city for Torrent Power',
              options: [
                { value: 'Ahmedabad', label: 'Ahmedabad' },
                { value: 'Agra', label: 'Agra' },
                { value: 'Surat', label: 'Surat' },
                { value: 'Bhiwandi', label: 'Bhiwandi' },
                { value: 'Shilmumbrakalwa', label: 'Shilmumbrakalwa' },
              ] as FieldOption[]
            });
          }
        }

        // Always add state/circle selection as fallback for operators that need it
        processedFields.push({
          key: 'state_circle',
          name: 'State/Circle',
          label: 'Select State/Circle',
          placeholder: 'Search and select state/circle...',
          required: false, // Make it optional
          order: 99, // Put it at the end
          type: 'select_circle',
          kwikapi_param: 'circle',
          description: 'Select your state or circle if required',
          options: [] as FieldOption[]
        });

        console.log('🔧 [Biller Details] Final processed fields:', processedFields);
        setDynamicFields(processedFields);

        // Initialize field values
        const initialValues: { [key: string]: string } = {};
        processedFields.forEach((field: DynamicField) => {
          // Pre-fill consumer/service number if it exists
          if ((field.name === 'Consumer Number' || field.name === 'Service Number') && consumerNumber) {
            initialValues[field.name] = consumerNumber;
          } else {
            initialValues[field.name] = '';
          }
        });
        console.log('🔧 [Biller Details] Initial field values:', initialValues);
        setDynamicFieldValues(initialValues);
      } else {
        console.error('🔧 [Biller Details] API returned error:', data.message);
        // Fallback: show consumer number and state fields
        const fallbackFields = [
          {
            key: 'consumer_number',
            name: 'Consumer Number',
            label: 'Consumer Number / Meter ID',
            placeholder: 'Enter consumer/meter number from your electricity bill',
            required: true,
            order: 0,
            type: 'text',
            kwikapi_param: 'number',
            description: 'Your electricity bill consumer number or meter ID',
            options: [] as FieldOption[]
          }
        ];

        // Special handling for Torrent Power - add city field
        if (operator?.operator_name.includes('Torrent Power')) {
          fallbackFields.push({
            key: 'city',
            name: 'City',
            label: 'City',
            placeholder: 'Select your city',
            required: true,
            order: 1,
            type: 'select',
            kwikapi_param: 'opt1',
            description: 'Select your city for Torrent Power',
            options: [
              { value: 'Ahmedabad', label: 'Ahmedabad' },
              { value: 'Agra', label: 'Agra' },
              { value: 'Surat', label: 'Surat' },
              { value: 'Bhiwandi', label: 'Bhiwandi' },
              { value: 'Shilmumbrakalwa', label: 'Shilmumbrakalwa' },
            ] as FieldOption[]
          });
        } else {
          fallbackFields.push({
            key: 'state_circle',
            name: 'State/Circle',
            label: 'Select State/Circle',
            placeholder: 'Search and select state/circle...',
            required: false,
            order: 1,
            type: 'select_circle',
            kwikapi_param: 'circle',
            description: 'Select your state or circle',
            options: [] as FieldOption[]
          });
        }

        setDynamicFields(fallbackFields);

        const initialValues: { [key: string]: string } = {
          'Consumer Number': consumerNumber || ''
        };
        if (operator?.operator_name.includes('Torrent Power')) {
          initialValues['City'] = '';
        } else {
          initialValues['State/Circle'] = '';
        }
        setDynamicFieldValues(initialValues);
      }
    } catch (error) {
      console.error('🔧 [Biller Details] Error fetching biller details:', error);
      // Fallback on error
      const fallbackFields = [
        {
          key: 'consumer_number',
          name: 'Consumer Number',
          label: 'Consumer Number / Meter ID',
          placeholder: 'Enter consumer/meter number from your electricity bill',
          required: true,
          order: 0,
          type: 'text',
          kwikapi_param: 'number',
          description: 'Your electricity bill consumer number or meter ID',
          options: [] as FieldOption[]
        }
      ];

      // Special handling for Torrent Power - add city field
      if (operator?.operator_name.includes('Torrent Power')) {
        fallbackFields.push({
          key: 'city',
          name: 'City',
          label: 'City',
          placeholder: 'Select your city',
          required: true,
          order: 1,
          type: 'select',
          kwikapi_param: 'opt1',
          description: 'Select your city for Torrent Power',
          options: [
            { value: 'Ahmedabad', label: 'Ahmedabad' },
            { value: 'Agra', label: 'Agra' },
            { value: 'Surat', label: 'Surat' },
            { value: 'Bhiwandi', label: 'Bhiwandi' },
            { value: 'Shilmumbrakalwa', label: 'Shilmumbrakalwa' },
          ] as FieldOption[]
        });
      }

      setDynamicFields(fallbackFields);

      const initialValues: { [key: string]: string } = {
        'Consumer Number': consumerNumber || ''
      };
      if (operator?.operator_name.includes('Torrent Power')) {
        initialValues['City'] = '';
      }
      setDynamicFieldValues(initialValues);
    }
  };

  const fetchBill = async () => {
    if (!selectedOperator) {
      setMessage('Please select electricity board');
      setMessageType('error');
      return;
    }

    console.log('🔍 [Bill Fetch] Dynamic fields:', dynamicFields);
    console.log('🔍 [Bill Fetch] Dynamic field values:', dynamicFieldValues);

    // Get consumer number from dynamic fields - prioritize fields mapped to 'number'
    const numberMappedField = dynamicFields.find(f => f.kwikapi_param === 'number');
    const consumerNumberValue = (numberMappedField ? dynamicFieldValues[numberMappedField.name] : null) ||
      dynamicFieldValues['Consumer Number'] ||
      dynamicFieldValues['Consumer Number / Meter ID'] ||
      dynamicFieldValues['Service Number'] ||
      dynamicFieldValues['Account Number'] ||
      dynamicFieldValues['consumer_number'] ||
      Object.values(dynamicFieldValues).find(v => v && typeof v === 'string' && v.trim() !== '' && !v.toLowerCase().includes('city'));

    if (!consumerNumberValue || (typeof consumerNumberValue === 'string' && consumerNumberValue.trim() === '')) {
      setMessage('Please enter consumer/service number');
      setMessageType('error');
      console.error('❌ [Bill Fetch] No consumer number found. Available fields:', Object.keys(dynamicFieldValues));
      return;
    }

    if (!customerMobile || customerMobile.length !== 10) {
      setMessage('Please enter a valid 10-digit Customer Mobile No.');
      setMessageType('error');
      return;
    }

    console.log('✅ [Bill Fetch] Consumer number found:', consumerNumberValue);

    // For operators requiring city/unit, check if those fields are filled
    const operator = operators.find(op => op.id === selectedOperator);
    if (!operator) return;

    // Validate required dynamic fields
    const missingFields = dynamicFields.filter(f => f.required && !dynamicFieldValues[f.name]);
    if (missingFields.length > 0) {
      setMessage(`Please enter ${missingFields[0].label}`);
      setMessageType('error');
      return;
    }

    setFetchingBill(true);
    setMessage('');
    setBillDetails(null);

    try {
      // Build opt parameters from dynamic fields
      const optParams: any = {
        opt1: '', // Will be set based on operator requirements
        opt2: '',
        opt3: '',
        opt4: '',
        opt5: '',
      };

      // Map dynamic field values to their corresponding opt parameters
      dynamicFields.forEach((field: DynamicField) => {
        const value = dynamicFieldValues[field.name];
        if (value && field.kwikapi_param && field.kwikapi_param !== 'number') {
          optParams[field.kwikapi_param] = value;
        }
      });

      // CRITICAL FIX: For MSEDC Maharashtra and similar operators, opt1 MUST contain the consumer number
      // This ensures consistent parameter mapping regardless of dynamic field configuration
      if (consumerNumberValue) {
        optParams.opt1 = consumerNumberValue;
      }

      console.log('📋 [Bill Fetch] Dynamic fields:', dynamicFields);
      console.log('📋 [Bill Fetch] Dynamic field values:', dynamicFieldValues);
      console.log('📋 [Bill Fetch] Mapped opt params:', optParams);

      const res = await fetch('/api/kwikapi/bill-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opid: operator?.kwikapi_opid,
          account_number: consumerNumberValue,
          consumer_number: consumerNumberValue,
          mobile_number: customerMobile,
          mobile: customerMobile,
          ...optParams, // Spread the opt parameters
        }),
      });

      const data = await res.json();

      if (data.success) {
        const billData = data.data;
        const newBillDetails = {
          consumer_name: billData.customer_name || billData.customername || 'N/A',
          bill_number: billData.bill_number || billData.billnumber || 'N/A',
          due_amount: billData.due_amount || billData.dueamount || '0',
          due_date: billData.due_date || billData.duedate || 'N/A',
          bill_date: billData.bill_date || billData.billdate || 'N/A',
          bill_period: billData.bill_period || billData.billperiod || 'N/A',
          bill_amount: billData.bill_amount || billData.due_amount || '0',
          ref_id: billData.ref_id || billData.refid || '',
        };

        setBillDetails(newBillDetails);

        // Auto-fill amount and customer name
        setAmount(newBillDetails.due_amount);
        setCustomerName(newBillDetails.consumer_name);

        setMessage(`✅ Bill found for ${newBillDetails.consumer_name} - Amount: ₹${newBillDetails.due_amount}`);
        setMessageType('success');
      } else {
        setMessage(`ℹ️ ${data.message || 'Unable to fetch bill details. You can still enter the amount manually below.'}`);
        setMessageType('info');
      }
    } catch (error: any) {
      setMessage(`❌ Error fetching bill: ${error.message}`);
      setMessageType('error');
    } finally {
      setFetchingBill(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = parseFloat(amount);

    // Check wallet balance
    if (walletBalance < totalAmount) {
      setMessage(
        `❌ Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, but need ₹${totalAmount.toFixed(2)}. Please add money to your wallet.`
      );
      setMessageType('error');
      return;
    }

    // Get consumer number from dynamic fields - try multiple possible field names
    const consumerNumberValue = dynamicFieldValues['Consumer Number'] ||
      dynamicFieldValues['Consumer Number / Meter ID'] ||
      dynamicFieldValues['Service Number'] ||
      dynamicFieldValues['Account Number'] ||
      dynamicFieldValues['consumer_number'] ||
      Object.values(dynamicFieldValues).find(v => v && v.trim() !== '' && !v.toLowerCase().includes('city'));

    if (!consumerNumberValue || consumerNumberValue.trim() === '') {
      setMessage('Please enter consumer/service number');
      setMessageType('error');
      console.error('❌ [Payment] No consumer number found. Available fields:', Object.keys(dynamicFieldValues));
      return;
    }

    if (!customerMobile || customerMobile.length !== 10) {
      setMessage('Please enter a valid 10-digit Customer Mobile No.');
      setMessageType('error');
      return;
    }

    console.log('✅ [Payment] Consumer number found:', consumerNumberValue);

    // For Torrent Power, check if city is provided
    const operator = operators.find(op => op.id === selectedOperator);
    if (operator?.operator_name.includes('Torrent Power')) {
      const cityValue = dynamicFieldValues['City'];
      if (!cityValue || cityValue.trim() === '') {
        setMessage('Please select city for Torrent Power');
        setMessageType('error');
        return;
      }
    }

    // Check if bill fetch is required - show warning but allow manual entry if amount is provided
    if (operator?.metadata?.bill_fetch === 'YES' && !billDetails && !amount) {
      setMessage('⚠️ Please get your bill details first or enter the amount manually.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const circle = circles.find(c => c.id === selectedCircle);

      // Build opt parameters from dynamic fields
      const optParams: any = {
        opt1: '', // Will be set based on operator requirements
        opt2: '',
        opt3: '',
        opt4: '',
        opt5: '',
      };

      // Map dynamic field values to their corresponding opt parameters
      dynamicFields.forEach((field: DynamicField) => {
        const value = dynamicFieldValues[field.name];
        if (value && field.kwikapi_param && field.kwikapi_param !== 'number') {
          optParams[field.kwikapi_param] = value;
        }
      });

      // CRITICAL FIX: For MSEDC Maharashtra and similar operators, opt1 MUST contain the consumer number
      // This ensures consistent parameter mapping regardless of dynamic field configuration
      if (consumerNumberValue) {
        optParams.opt1 = consumerNumberValue;
      }

      console.log('💳 [Payment] Dynamic fields:', dynamicFields);
      console.log('💳 [Payment] Dynamic field values:', dynamicFieldValues);
      console.log('💳 [Payment] Mapped opt params:', optParams);

      // CRITICAL FIX: For operators that support bill fetch, get fresh ref_id before payment
      let currentRefId = billDetails?.ref_id;
      let currentBillDetails = billDetails;

      if (operator?.metadata?.bill_fetch === 'YES' && billDetails) {
        console.log('🔄 [Payment] Getting fresh bill details to ensure current ref_id...');
        setMessage('🔄 Getting fresh bill details for payment...');
        
        try {
          // Build opt parameters for bill fetch (same as payment)
          const billFetchOptParams: any = {};
          dynamicFields.forEach((field: DynamicField) => {
            const value = dynamicFieldValues[field.name];
            if (value && field.kwikapi_param && field.kwikapi_param !== 'number') {
              billFetchOptParams[field.kwikapi_param] = value;
            }
          });

          // For MSEDC Maharashtra and similar operators, opt1 MUST contain the consumer number
          if (consumerNumberValue) {
            billFetchOptParams.opt1 = consumerNumberValue;
          }

          const freshBillRes = await fetch('/api/kwikapi/bill-fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              opid: operator?.kwikapi_opid,
              account_number: consumerNumberValue,
              consumer_number: consumerNumberValue,
              mobile_number: customerMobile,
              mobile: customerMobile,
              ...billFetchOptParams,
            }),
          });

          const freshBillData = await freshBillRes.json();

          if (freshBillData.success && freshBillData.data?.ref_id) {
            console.log('✅ [Payment] Fresh ref_id obtained:', freshBillData.data.ref_id);
            currentRefId = freshBillData.data.ref_id;
            
            // Update bill details with fresh data
            currentBillDetails = {
              consumer_name: freshBillData.data.customer_name || freshBillData.data.customername || billDetails.consumer_name,
              bill_number: freshBillData.data.bill_number || freshBillData.data.billnumber || billDetails.bill_number,
              due_amount: freshBillData.data.due_amount || freshBillData.data.dueamount || billDetails.due_amount,
              due_date: freshBillData.data.due_date || freshBillData.data.duedate || billDetails.due_date,
              bill_date: freshBillData.data.bill_date || freshBillData.data.billdate || billDetails.bill_date,
              bill_period: freshBillData.data.bill_period || freshBillData.data.billperiod || billDetails.bill_period,
              bill_amount: freshBillData.data.bill_amount || freshBillData.data.due_amount || billDetails.bill_amount,
              ref_id: freshBillData.data.ref_id,
            };

            setMessage('✅ Fresh bill details obtained. Processing payment...');
          } else {
            console.warn('⚠️ [Payment] Could not get fresh ref_id, using existing:', currentRefId);
            setMessage('⚠️ Using existing bill details for payment...');
          }
        } catch (billFetchError) {
          console.warn('⚠️ [Payment] Fresh bill fetch failed, using existing ref_id:', billFetchError);
          setMessage('⚠️ Using existing bill details for payment...');
        }
      }

      const payload = {
        service_type: 'ELECTRICITY',
        operator_code: operator?.kwikapi_opid || operator?.operator_code,
        amount: totalAmount,
        customer_name: customerName || currentBillDetails?.consumer_name,
        consumer_number: consumerNumberValue,
        number: consumerNumberValue, // Explicitly send 'number' field
        mobile_number: customerMobile,
        customer_mobile: customerMobile,
        ref_id: currentRefId, // Use fresh ref_id
        bill_details: currentBillDetails, // Use fresh bill details
        ...optParams, // Spread the opt parameters
      };

      console.log('💳 [Payment] Final payload with fresh ref_id:', {
        ...payload,
        ref_id: currentRefId,
        bill_details_ref_id: currentBillDetails?.ref_id
      });

      const res = await fetch('/api/kwikapi/bill-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const responseData = data.data;
        const status = responseData.status;
        const message = responseData.message || 'Transaction completed';
        const operatorRef = responseData.operator_ref || '';
        const balance = responseData.balance || '';
        const kwikApiStatus = responseData.kwikapi_status || status;

        // Show real-time KwikAPI status
        if (status === 'SUCCESS') {
          // Clean up message - remove KwikAPI balance if present in the message string
          let cleanMessage = message.replace(/Your Balance is.*$/i, '').trim();
          if (cleanMessage.endsWith('.')) cleanMessage = cleanMessage.slice(0, -1);

          const finalSuccessMsg = `✅ ${cleanMessage}! Redirecting to receipt...`;

          setMessage(finalSuccessMsg);
          setMessageType('success');

          // Redirect to receipt page after successful payment
          const transactionId = responseData.transaction_id;
          if (transactionId) {
            setTimeout(() => {
              router.push(`/dashboard/recharge/electricity/receipt?txn=${transactionId}`);
            }, 2000);
          } else {
            // Fallback: Reset form if no transaction ID
            setTimeout(() => {
              setConsumerNumber('');
              setAmount('');
              setCustomerName('');
              setBillDetails(null);
              setDynamicFieldValues({});
              fetchWalletBalance();
            }, 3000);
          }
        } else if (status === 'PENDING') {
          setMessage(
            `⏳ ${message}${operatorRef ? `\nRef: ${operatorRef}` : ''}. Redirecting to status...`
          );
          setMessageType('info');

          // Redirect to receipt page even for pending if it was processed
          const transactionId = responseData.transaction_id;
          if (transactionId) {
            setTimeout(() => {
              router.push(`/dashboard/recharge/electricity/receipt?txn=${transactionId}`);
            }, 3000);
          }
        } else {
          setMessage(
            `❌ ${message}${operatorRef ? `\nRef: ${operatorRef}` : ''}\nKwikAPI Status: ${kwikApiStatus}`
          );
          setMessageType('error');
        }

        // Refresh wallet balance
        fetchWalletBalance();
      } else {
        setMessage(data.message || '❌ Payment failed');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorChange = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setBillDetails(null);
    setDynamicFields([]);
    setDynamicFieldValues({});
    setOperatorSelected(!!operatorId);

    if (operatorId) {
      fetchBillerDetails(operatorId);
      setCurrentStep(2); // Move to step 2 when operator is selected
    } else {
      setCurrentStep(1);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚡ Electricity Bill Payment</h1>
          <p className="text-gray-600">Pay your electricity bills instantly with real-time processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">💰 Available Wallet Balance</p>
                  <p className="text-4xl font-bold">
                    {loadingBalance ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `₹${walletBalance.toFixed(2)}`
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-2">
                    {session?.user?.name && `${session.user.name}'s Wallet`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={fetchWalletBalance}
                    disabled={loadingBalance}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/wallet')}
                    className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                  >
                    💳 Add Money
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                      1
                    </div>
                    <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      Select Electricity Board
                    </span>
                  </div>

                  <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>

                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                      2
                    </div>
                    <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      Bill Details & Payment
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Operator Selection */}
                <div className={`space-y-6 ${currentStep !== 1 ? 'opacity-50' : ''}`}>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Step 1: Select Your Electricity Board
                  </h3>

                  {/* Operator Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Electricity Board / Distribution Company
                    </label>
                    <SearchableSelect
                      options={operators.map(op => ({
                        value: op.id,
                        label: op.operator_name,
                        data: op
                      }))}
                      value={selectedOperator}
                      onChange={handleOperatorChange}
                      placeholder="Search and select your electricity board..."
                      required
                    />

                    {/* Operator Tips */}
                    {selectedOperator && (
                      <div className="mt-3">
                        {operators.find(op => op.id === selectedOperator)?.operator_name.includes('Torrent Power') && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">💡 Torrent Power:</span> All Torrent Power areas are now merged under one operator.
                            </p>
                          </div>
                        )}

                        {operators.find(op => op.id === selectedOperator)?.metadata?.message && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              <span className="font-semibold">ℹ️ Note:</span> {operators.find(op => op.id === selectedOperator)?.metadata?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Bill Details & Payment */}
                {operatorSelected && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Step 2: Enter Bill Details
                    </h3>

                    {/* Show message if no dynamic fields are loaded yet */}
                    {dynamicFields.length === 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          ⏳ Loading required fields for this electricity board...
                        </p>
                      </div>
                    )}

                    {/* Debug Info - Remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Debug Info:</h4>
                        <p className="text-sm text-gray-600 mb-2">Dynamic Fields: {dynamicFields.length}</p>
                        <p className="text-sm text-gray-600 mb-2">Field Values: {JSON.stringify(dynamicFieldValues, null, 2)}</p>
                        <button
                          type="button"
                          onClick={() => console.log('Current state:', { dynamicFields, dynamicFieldValues })}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                        >
                          Log State
                        </button>
                      </div>
                    )}

                    {/* Dynamic Fields - All fields are now dynamic based on operator requirements */}
                    {dynamicFields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'select_circle' ? (
                          <SearchableSelect
                            options={circles.map(c => ({
                              value: c.id,
                              label: c.circle_name,
                              data: c
                            }))}
                            value={selectedCircle}
                            onChange={setSelectedCircle}
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        ) : field.options && field.options.length > 0 ? (
                          <select
                            value={dynamicFieldValues[field.name] || ''}
                            onChange={(e) => {
                              console.log(`🔍 Field "${field.name}" changed to:`, e.target.value);
                              setDynamicFieldValues(prev => ({
                                ...prev,
                                [field.name]: e.target.value
                              }));
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={field.required}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((option: any) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={dynamicFieldValues[field.name] || ''}
                            onChange={(e) => {
                              console.log(`🔍 Field "${field.name}" changed to:`, e.target.value);
                              setDynamicFieldValues(prev => ({
                                ...prev,
                                [field.name]: e.target.value
                              }));
                            }}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={field.required}
                          />
                        )}
                        {field.description && (
                          <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                        )}
                      </div>
                    ))}

                    {/* Circle Selection - Only show if no dynamic fields specify location */}
                    {dynamicFields.length > 0 && !dynamicFields.some(field =>
                      field.name.toLowerCase().includes('state') ||
                      field.name.toLowerCase().includes('circle') ||
                      field.name.toLowerCase().includes('city')
                    ) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select State/Circle
                          </label>
                          <SearchableSelect
                            options={circles.map(c => ({
                              value: c.id,
                              label: c.circle_name,
                              data: c
                            }))}
                            value={selectedCircle}
                            onChange={setSelectedCircle}
                            placeholder="Search and select state/circle..."
                            required
                          />
                        </div>
                      )}

                    {/* Customer Mobile No. - Required by KwikAPI for bill fetch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Mobile No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={customerMobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setCustomerMobile(val);
                        }}
                        placeholder="Enter 10-digit customer mobile number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">This is required for bill fetching and payment notifications.</p>
                    </div>

                    {/* Bill Fetch Section */}
                    {dynamicFields.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-3xl">📋</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-purple-900 mb-1">Bill Fetch</h3>
                            <p className="text-sm text-purple-700">
                              {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES'
                                ? 'Click "Get Bill Details" to view your bill information before payment.'
                                : 'Bill fetch not available for this operator. Enter amount manually.'}
                            </p>
                          </div>
                        </div>

                        {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' && !billDetails && (
                          <button
                            type="button"
                            onClick={fetchBill}
                            disabled={fetchingBill}
                            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                          >
                            {fetchingBill ? '⏳ Getting Bill Details...' : '🔍 Get Bill Details'}
                          </button>
                        )}
                        {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' && (
                          <p className="text-xs text-purple-600 mt-2 text-center">
                            Note: If bill fetch fails, you can still scroll down and enter the amount manually.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bill Details Display */}
                    {billDetails && (
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-5 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-blue-900 text-lg">📄 Your Bill Details</h3>
                          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3">
                            <span className="text-gray-600 text-xs">Consumer Name</span>
                            <p className="font-semibold text-gray-900">{billDetails.consumer_name}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <span className="text-gray-600 text-xs">Bill Number</span>
                            <p className="font-semibold text-gray-900">{billDetails.bill_number}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <span className="text-gray-600 text-xs">Bill Date</span>
                            <p className="font-semibold text-gray-900">{billDetails.bill_date}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <span className="text-gray-600 text-xs">Due Date</span>
                            <p className="font-semibold text-red-600">{billDetails.due_date}</p>
                          </div>
                          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-3 border-2 border-green-400 md:col-span-2">
                            <span className="text-gray-700 text-xs font-medium">Amount Due</span>
                            <p className="font-bold text-2xl text-green-700">₹{billDetails.due_amount}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bill Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter bill amount"
                        min={operators.find(op => op.id === selectedOperator)?.min_amount || 100}
                        max={operators.find(op => op.id === selectedOperator)?.max_amount || 50000}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Customer Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {loading ? '⏳ Processing Payment...' : `💳 Pay Electricity Bill${amount ? ` - ₹${amount}` : ''}`}
                    </button>

                    {/* Message */}
                    {message && (
                      <div className={`p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                        messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                        {message}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800">💡 Quick Tips</h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Bill Fetch</h3>
                  <p className="text-sm text-blue-800">
                    Use bill fetch to automatically get your bill details and ensure accurate payment.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">⚡ Instant Processing</h3>
                  <p className="text-sm text-green-800">
                    All payments are processed in real-time with immediate confirmation.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">💰 Earn Rewards</h3>
                  <p className="text-sm text-purple-800">
                    Get cashback and commissions on every successful payment.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">🔒 Secure Payments</h3>
                  <p className="text-sm text-yellow-800">
                    All transactions are encrypted and processed through secure channels.
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">📊 Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/dashboard/recharge/transactions')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📈 View Transaction History
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/wallet')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    💳 Manage Wallet
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/recharge')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📱 Other Recharge Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <RechargeBrandingFooter />
      </div>
    </DashboardLayout>
  );
}
