'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, Tv, Zap } from 'lucide-react';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  kwikapi_opid: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  metadata?: {
    bill_fetch?: string;
    message?: string;
  };
}

interface BillerParameter {
  key: string;
  name: string;
  required: boolean;
  order: number;
}

interface BillerDetails {
  id: string;
  operator_id: number;
  operator_name: string;
  service_type: string;
  bill_fetch: string;
  amount_minimum: string;
  amount_maximum: string;
  parameters: BillerParameter[];
}

export default function RechargeForm() {
  const [activeTab, setActiveTab] = useState('prepaid');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [billerDetails, setBillerDetails] = useState<BillerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dynamicParams, setDynamicParams] = useState<Record<string, string>>({});

  // Load operators on component mount
  useEffect(() => {
    loadOperators();
  }, []);

  // Load operators based on active tab
  useEffect(() => {
    loadOperators();
  }, [activeTab]);

  const loadOperators = async () => {
    try {
      setLoading(true);
      setError('');

      const serviceTypeMap = {
        prepaid: 'PREPAID',
        dth: 'DTH', 
        postpaid: 'POSTPAID',
        electricity: 'ELECTRICITY'
      };

      const response = await fetch(`/api/recharge/operators?service_type=${serviceTypeMap[activeTab as keyof typeof serviceTypeMap]}`);

      if (!response.ok) {
        throw new Error('Failed to load operators');
      }

      const data = await response.json();
      if (data.success) {
        setOperators(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load operators');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorSelect = async (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator) return;

    setSelectedOperator(operator);
    setBillerDetails(null);
    setDynamicParams({});

    // For postpaid and electricity, fetch biller details
    if (['POSTPAID', 'ELECTRICITY'].includes(operator.service_type) && operator.kwikapi_opid) {
      try {
        setLoading(true);
        const response = await fetch(`/api/kwikapi/biller-details?opid=${operator.kwikapi_opid}`);

        if (!response.ok) {
          throw new Error('Failed to load biller details');
        }

        const data = await response.json();
        if (data.success) {
          setBillerDetails({
            id: operator.id,
            operator_id: operator.kwikapi_opid,
            operator_name: operator.operator_name,
            service_type: operator.service_type,
            bill_fetch: operator.metadata?.bill_fetch || 'NO',
            amount_minimum: operator.min_amount.toString(),
            amount_maximum: operator.max_amount.toString(),
            parameters: data.data?.parameters || []
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load biller details');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDynamicParamChange = (key: string, value: string) => {
    setDynamicParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBillFetch = async () => {
    if (!selectedOperator || !billerDetails) return;

    try {
      setLoading(true);
      setError('');

      const requestData = {
        opid: selectedOperator.kwikapi_opid,
        number: mobileNumber,
        mobile: mobileNumber,
        amount: parseFloat(amount) || 10,
        ...dynamicParams
      };

      const response = await fetch('/api/kwikapi/bill-fetch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bill');
      }

      const data = await response.json();
      
      if (data.success) {
        const billData = data.data;
        setSuccess(`✅ Bill found for ${billData.customer_name || billData.customername || 'customer'}. Due amount: ₹${billData.due_amount || billData.dueamount || amount}`);
        // Update amount with fetched bill amount
        if (billData.due_amount || billData.dueamount) {
          setAmount((billData.due_amount || billData.dueamount).toString());
        }
      } else {
        setError(data.message || 'Failed to fetch bill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bill');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const endpoint = ['PREPAID', 'DTH'].includes(selectedOperator.service_type) 
        ? '/api/kwikapi/recharge' 
        : '/api/kwikapi/bill-payment';

      const payload = ['PREPAID', 'DTH'].includes(selectedOperator.service_type)
        ? {
            opid: selectedOperator.kwikapi_opid,
            number: mobileNumber,
            amount: parseFloat(amount),
            mobile: mobileNumber,
            circle_code: '0' // Default circle for DTH/prepaid
          }
        : {
            opid: selectedOperator.kwikapi_opid,
            number: mobileNumber,
            amount: parseFloat(amount),
            mobile: mobileNumber,
            ...dynamicParams
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      const data = await response.json();
      
      if (data.success) {
        const responseData = data.data;
        const status = responseData.status;
        const message = responseData.message || 'Transaction completed';
        const operatorRef = responseData.opr_id || responseData.operator_ref || '';
        const balance = responseData.balance || '';
        
        // Show real-time KwikAPI status
        if (status === 'SUCCESS') {
          setSuccess(`✅ ${message}${operatorRef ? ` | Ref: ${operatorRef}` : ''}${balance ? ` | Balance: ₹${balance}` : ''}`);
        } else if (status === 'PENDING') {
          setSuccess(`⏳ ${message}${operatorRef ? ` | Ref: ${operatorRef}` : ''}`);
        } else {
          setError(`❌ ${message}${operatorRef ? ` | Ref: ${operatorRef}` : ''}`);
        }
        
        // Reset form on success or pending
        if (status === 'SUCCESS' || status === 'PENDING') {
          setMobileNumber('');
          setAmount('');
          setDynamicParams({});
          setSelectedOperator(null);
          setBillerDetails(null);
        }
      } else {
        setError(data.message || 'Transaction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'prepaid': return <Smartphone className="w-4 h-4" />;
      case 'dth': return <Tv className="w-4 h-4" />;
      case 'postpaid': return <Smartphone className="w-4 h-4" />;
      case 'electricity': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Recharge & Bill Payment</CardTitle>
        <CardDescription>
          Pay your mobile, DTH, and utility bills instantly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prepaid" className="flex items-center gap-2">
              {getTabIcon('prepaid')}
              Prepaid
            </TabsTrigger>
            <TabsTrigger value="dth" className="flex items-center gap-2">
              {getTabIcon('dth')}
              DTH
            </TabsTrigger>
            <TabsTrigger value="postpaid" className="flex items-center gap-2">
              {getTabIcon('postpaid')}
              Postpaid
            </TabsTrigger>
            <TabsTrigger value="electricity" className="flex items-center gap-2">
              {getTabIcon('electricity')}
              Electricity
            </TabsTrigger>
          </TabsList>

          {['prepaid', 'dth', 'postpaid', 'electricity'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="operator">Select Operator</Label>
                  <Select onValueChange={handleOperatorSelect} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.operator_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">
                    {tab === 'dth' ? 'DTH Number' : 
                     tab === 'electricity' ? 'Consumer Number' : 'Mobile Number'}
                  </Label>
                  <Input
                    id="number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder={`Enter ${tab === 'dth' ? 'DTH' : tab === 'electricity' ? 'consumer' : 'mobile'} number`}
                    required
                  />
                </div>

                {/* Dynamic parameters for postpaid and electricity */}
                {billerDetails && billerDetails.parameters.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Additional Information</h4>
                    {billerDetails.parameters.map((param) => (
                      <div key={param.key} className="space-y-2">
                        <Label htmlFor={param.key}>
                          {param.name} {param.required && '*'}
                        </Label>
                        <Input
                          id={param.key}
                          value={dynamicParams[param.key] || ''}
                          onChange={(e) => handleDynamicParamChange(param.key, e.target.value)}
                          placeholder={`Enter ${param.name.toLowerCase()}`}
                          required={param.required}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedOperator?.min_amount || 1}
                    max={selectedOperator?.max_amount || 50000}
                    required
                  />
                  {selectedOperator && (
                    <p className="text-sm text-gray-500">
                      Min: ₹{selectedOperator.min_amount} | Max: ₹{selectedOperator.max_amount}
                    </p>
                  )}
                </div>

                {/* Bill fetch button for postpaid and electricity */}
                {billerDetails && billerDetails.bill_fetch === 'YES' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBillFetch}
                    disabled={loading || !mobileNumber || !amount}
                    className="w-full"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Fetch Bill Details
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !selectedOperator || !mobileNumber || !amount}
                  className="w-full"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {tab === 'prepaid' || tab === 'dth' ? 'Recharge Now' : 'Pay Bill'}
                </Button>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}