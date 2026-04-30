"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export function TeamPaymentForm() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paymentMethod: "UPI",
    transactionReference: "",
    proofFileUrl: "",
  });

  // Fetch current payment status on mount
  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      const res = await fetch("/api/payments/status");
      if (res.status === 404) {
        setPaymentStatus(null);
        return;
      }
      const data = await res.json();
      setPaymentStatus(data.status);
    } catch (err) {
      console.error("Failed to fetch payment status:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit payment");
        return;
      }

      setPaymentStatus(data.status);
      setFormData({
        paymentMethod: "UPI",
        transactionReference: "",
        proofFileUrl: "",
      });
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  // If payment is verified, show success
  if (paymentStatus === "VERIFIED") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Payment Verified</h3>
            <p className="text-sm text-green-700">
              Your team&apos;s registration fee has been verified. You can now
              submit your project repository.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If payment is pending, show waiting state
  if (paymentStatus === "PENDING") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">Payment Pending</h3>
            <p className="text-sm text-yellow-700">
              Your payment submission is under review. You&apos;ll be notified once
              it&apos;s verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If payment is rejected, show error with reason
  if (paymentStatus === "REJECTED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Payment Rejected</h3>
            <p className="text-sm text-red-700 mb-3">
              Your payment submission was rejected. Please resubmit with correct
              details.
            </p>
            <button
              onClick={() => setPaymentStatus(null)}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              Submit again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show payment form
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold mb-4">Register Your Team</h2>
      <p className="text-gray-600 text-sm mb-6">
        Submit your registration fee using UPI or Bank Transfer. Once verified,
        you&apos;ll be able to submit your project repository.
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({ ...formData, paymentMethod: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID / Reference Number *
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) =>
              setFormData({
                ...formData,
                transactionReference: e.target.value,
              })
            }
            placeholder="e.g., UPI transaction ID or Bank confirmation number"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps us verify your payment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proof File URL (optional)
          </label>
          <input
            type="url"
            value={formData.proofFileUrl}
            onChange={(e) =>
              setFormData({ ...formData, proofFileUrl: e.target.value })
            }
            placeholder="e.g., link to screenshot or receipt"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload receipt/screenshot to a service like Imgur and paste the
            link
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.transactionReference}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Payment Instructions
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Amount:</strong> ₹500 (subject to change - contact organizers
            for current amount)
          </p>
          <p>
            <strong>For UPI:</strong> <code className="bg-gray-100 px-1">upi://</code> payments or any UPI app
          </p>
          <p>
            <strong>For Bank Transfer:</strong> Contact organizers for bank
            details
          </p>
          <p className="text-gray-500 italic mt-3">
            After submitting, wait for verification from our admin team.
          </p>
        </div>
      </div>
    </div>
  );
}
