"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface PendingPayment {
  id: string;
  paymentMethod: string;
  paymentPurpose?: "REGISTRATION" | "EXTRA_SLOT";
  transactionReference: string;
  createdAt: string;
  receiptFileName?: string | null;
  team: {
    id: string;
    name: string;
    captain: {
      name: string | null;
      email: string;
    } | null;
  };
}

interface Stats {
  PENDING?: number;
  VERIFIED?: number;
  REJECTED?: number;
}

export function AdminPaymentPanel() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments/verify");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.pending || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    setVerifyingId(paymentId);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          status: "VERIFIED",
        }),
      });

      if (res.ok) {
        // Remove from list and update stats
        setPayments(payments.filter((p) => p.id !== paymentId));
        setStats((s) => ({
          ...s,
          PENDING: (s.PENDING || 0) - 1,
          VERIFIED: (s.VERIFIED || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Failed to verify payment:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) return;

    setVerifyingId(selectedPayment.id);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          status: "REJECTED",
          rejectionReason,
        }),
      });

      if (res.ok) {
        setPayments(
          payments.filter((p) => p.id !== selectedPayment.id)
        );
        setStats((s) => ({
          ...s,
          PENDING: (s.PENDING || 0) - 1,
          REJECTED: (s.REJECTED || 0) + 1,
        }));
        setShowRejectModal(false);
        setSelectedPayment(null);
        setRejectionReason("");
      }
    } catch (err) {
      console.error("Failed to reject payment:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600 font-medium">PENDING</p>
              <p className="text-2xl font-bold text-yellow-900">
                {stats.PENDING || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">VERIFIED</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.VERIFIED || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">REJECTED</p>
              <p className="text-2xl font-bold text-red-900">
                {stats.REJECTED || 0}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Pending Payments</h2>
          <p className="text-sm text-gray-600 mt-1">
            {payments.length} payment(s) awaiting verification
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No pending payments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {payment.team.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Captain:{" "}
                      {payment.team.captain?.name ||
                        payment.team.captain?.email ||
                        "N/A"}
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {payment.paymentPurpose === "EXTRA_SLOT" ? "Extra Slot" : "Registration"}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>Transaction ID:</strong> {payment.transactionReference}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {new Date(payment.createdAt).toLocaleString()}
                  </p>
                  {payment.receiptFileName ? (
                    <a
                      href={`/api/payments/receipt/${payment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View receipt
                    </a>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(payment.id)}
                    disabled={verifyingId === payment.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {verifyingId === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRejectModal(true);
                    }}
                    disabled={verifyingId === payment.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-medium py-2 rounded hover:bg-red-700 disabled:bg-gray-400 transition"
                  >
                    {verifyingId === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold">Reject Payment</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Rejecting payment for <strong>{selectedPayment.team.name}</strong>
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (will be shown to team)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm mb-4"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPayment(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || verifyingId === selectedPayment.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {verifyingId === selectedPayment.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
