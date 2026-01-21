'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  IndianRupee,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Shield,
  CheckCircle,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme?: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  discount_amount: number;
  net_amount: number;
  fee_categories?: { id: string; name: string };
}

interface Invoice {
  id: string;
  invoice_number: string;
  month: number | null;
  year: number | null;
  total_amount: number;
  discount_amount: number;
  late_fee: number;
  net_amount: number;
  paid_amount: number;
  balance_amount: number;
  due_date: string;
  status: string;
  students?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    email?: string;
    phone?: string;
    current_class?: { name: string };
    current_section?: { name: string };
  };
  fee_invoice_items?: InvoiceItem[];
}

interface ParentInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function PayInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const studentId = searchParams.get('student_id');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invoice
        const invoiceResponse = await fetch(
          `/api/parent/invoices?student_id=${studentId}`
        );
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          const inv = invoiceData.data?.find((i: Invoice) => i.id === invoiceId);
          if (inv) {
            setInvoice(inv);
          } else {
            setError('Invoice not found');
          }
        } else {
          setError('Failed to fetch invoice');
        }

        // Fetch parent info
        const parentResponse = await fetch('/api/parent/profile');
        if (parentResponse.ok) {
          const parentData = await parentResponse.json();
          if (parentData.data) {
            setParentInfo({
              first_name: parentData.data.first_name || '',
              last_name: parentData.data.last_name || '',
              email: parentData.data.email || '',
              phone: parentData.data.phone || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId && studentId) {
      fetchData();
    } else {
      setError('Missing invoice or student information');
      setLoading(false);
    }
  }, [invoiceId, studentId]);

  const formatMonth = (month: number | null, year: number | null) => {
    if (!month || !year) return 'N/A';
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const verifyPayment = useCallback(
    async (response: RazorpayResponse) => {
      setVerifying(true);
      try {
        const verifyResponse = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const data = await verifyResponse.json();

        if (verifyResponse.ok && data.success) {
          router.push(data.redirect_url || '/parent/fees/success');
        } else {
          setError(data.error || 'Payment verification failed');
          setVerifying(false);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Payment verification failed. Please contact support.');
        setVerifying(false);
      }
    },
    [router]
  );

  const handlePayment = async () => {
    if (!invoice || !studentId || !parentInfo) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          student_id: studentId,
          amount: parseFloat(invoice.balance_amount?.toString() || '0'),
          customer_name: `${parentInfo.first_name} ${parentInfo.last_name}`.trim(),
          customer_email: parentInfo.email,
          customer_phone: parentInfo.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.checkout_options) {
        // Open Razorpay checkout
        const options: RazorpayOptions = {
          ...data.data.checkout_options,
          handler: verifyPayment,
          modal: {
            ondismiss: () => {
              setProcessing(false);
              setError('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setError(data.error || 'Failed to initiate payment');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Link href="/parent/fees">
              <Button>Back to Fees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const balanceAmount = parseFloat(invoice.balance_amount?.toString() || '0');
  const isProcessingPayment = processing || verifying;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/parent/fees">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="font-semibold text-gray-900">Pay Fee</h1>
                  <p className="text-xs text-gray-500">Complete your payment</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
                    <CardDescription>
                      {formatMonth(invoice.month, invoice.year)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={invoice.status === 'overdue' ? 'danger' : 'warning'}
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Student Info */}
                {invoice.students && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500">Student</p>
                    <p className="font-medium">
                      {invoice.students.first_name} {invoice.students.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.students.admission_number} |{' '}
                      {invoice.students.current_class?.name || 'N/A'}
                      {invoice.students.current_section?.name &&
                        `-${invoice.students.current_section.name}`}
                    </p>
                  </div>
                )}

                {/* Fee Breakdown */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-gray-900">Fee Breakdown</h3>
                  <div className="divide-y divide-gray-200">
                    {invoice.fee_invoice_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="text-gray-600">
                          {item.fee_categories?.name || item.description}
                        </span>
                        <span>
                          ₹
                          {parseFloat(
                            item.net_amount?.toString() || '0'
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {invoice.late_fee > 0 && (
                      <div className="flex justify-between py-2 text-sm text-red-600">
                        <span>Late Fee</span>
                        <span>₹{invoice.late_fee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount</span>
                    <span>
                      ₹
                      {parseFloat(
                        invoice.net_amount?.toString() || '0'
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>
                      ₹
                      {parseFloat(
                        invoice.paid_amount?.toString() || '0'
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Balance Due</span>
                    <span className="text-primary">
                      ₹{balanceAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due Date:{' '}
                    {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card className="border-2 border-primary">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Online Payment</h3>
                    <p className="text-sm text-gray-500">
                      Secure payment via UPI, Cards, Net Banking
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount to Pay</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{balanceAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={
                    isProcessingPayment || balanceAmount <= 0 || !razorpayLoaded
                  }
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying Payment...
                    </>
                  ) : processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Pay ₹{balanceAmount.toLocaleString()}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                  <Shield className="h-3 w-3" />
                  <span>Secured by Razorpay Payment Gateway</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Accepted Payment Methods
                </h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>UPI</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Debit Card</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Net Banking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Wallets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
