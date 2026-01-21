'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Save,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  TestTube,
} from 'lucide-react';

interface RazorpaySettings {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
  mode: 'test' | 'live';
  is_enabled: boolean;
  display_name: string;
  theme_color: string;
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  const [formData, setFormData] = useState<RazorpaySettings>({
    key_id: '',
    key_secret: '',
    webhook_secret: '',
    mode: 'test',
    is_enabled: false,
    display_name: '',
    theme_color: '#3399cc',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/razorpay');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setHasExistingConfig(true);
          setFormData({
            key_id: data.data.key_id || '',
            key_secret: data.data.key_secret_encrypted || '',
            webhook_secret: data.data.webhook_secret_encrypted || '',
            mode: data.data.mode || 'test',
            is_enabled: data.data.is_enabled || false,
            display_name: data.data.display_name || '',
            theme_color: data.data.theme_color || '#3399cc',
          });
        }
      }
    } catch {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear test result when credentials change
    if (name === 'key_id' || name === 'key_secret') {
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.key_id || !formData.key_secret) {
      setTestResult({
        success: false,
        message: 'Please enter Key ID and Key Secret first',
      });
      return;
    }

    // Don't test with masked values
    if (formData.key_secret === '••••••••••••••••') {
      setTestResult({
        success: false,
        message: 'Please enter a new Key Secret to test',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings/razorpay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_id: formData.key_id,
          key_secret: formData.key_secret,
        }),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message,
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setHasExistingConfig(true);
        // Update form with masked values from response
        if (data.data) {
          setFormData((prev) => ({
            ...prev,
            key_secret: data.data.key_secret_encrypted || prev.key_secret,
            webhook_secret: data.data.webhook_secret_encrypted || prev.webhook_secret,
          }));
        }
        alert('Settings saved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
          <p className="text-gray-500">Configure Razorpay for online fee collection</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Razorpay Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Key ID"
                name="key_id"
                value={formData.key_id}
                onChange={handleChange}
                placeholder="rzp_test_xxxxxxxxxxxxx"
                required
              />

              <div className="relative">
                <Input
                  label="Key Secret"
                  name="key_secret"
                  type={showSecret ? 'text' : 'password'}
                  value={formData.key_secret}
                  onChange={handleChange}
                  placeholder={hasExistingConfig ? 'Enter new secret to change' : 'Enter Key Secret'}
                  required={!hasExistingConfig}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Webhook Secret (Optional)"
                  name="webhook_secret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={formData.webhook_secret}
                  onChange={handleChange}
                  placeholder="For webhook signature verification"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showWebhookSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  icon={
                    testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )
                  }
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>

                {testResult && (
                  <div
                    className={`mt-3 flex items-center gap-2 text-sm ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="test">Test Mode</option>
                  <option value="live">Live Mode</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.mode === 'test'
                    ? 'Use test mode for development and testing'
                    : 'Live mode processes real payments'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">
                    Enable Payment Gateway
                  </label>
                  <p className="text-sm text-gray-500">
                    Allow parents to pay fees online
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={formData.is_enabled}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <Input
                label="Display Name (Optional)"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Shown on checkout (e.g., School Name)"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme Color (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleChange}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleChange}
                    placeholder="#3399cc"
                    className="flex-1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Customize the checkout popup color
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>
                  Create a Razorpay account at{' '}
                  <a
                    href="https://dashboard.razorpay.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    dashboard.razorpay.com
                  </a>
                </li>
                <li>
                  Go to Settings → API Keys and generate your Key ID and Key Secret
                </li>
                <li>
                  Copy the credentials and paste them above
                </li>
                <li>
                  Click &quot;Test Connection&quot; to verify your credentials
                </li>
                <li>
                  For webhooks, go to Settings → Webhooks and add:{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/api/payments/razorpay/webhook`
                      : '/api/payments/razorpay/webhook'}
                  </code>
                </li>
                <li>
                  Select &quot;payment.captured&quot; and &quot;payment.failed&quot; events
                </li>
                <li>
                  Copy the Webhook Secret and paste it above
                </li>
                <li>
                  Toggle &quot;Enable Payment Gateway&quot; when ready to accept payments
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={saving}
            icon={
              saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )
            }
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
