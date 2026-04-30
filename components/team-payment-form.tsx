"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const UPI_ID = "9606726468@axl";
const REGISTRATION_FEE = "150";
const PAYMENT_NOTE = "Zero Day registration";
const PAYEE_NAME = "Zero Day";

const upiParams = new URLSearchParams({
  pa: UPI_ID,
  pn: PAYEE_NAME,
  am: REGISTRATION_FEE,
  cu: "INR",
  tn: PAYMENT_NOTE,
});

const UPI_URI = `upi://pay?${upiParams.toString()}`;
const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(UPI_URI)}`;

export function TeamPaymentForm() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

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
      if (!receiptFile) {
        setError("Payment receipt or screenshot is required");
        return;
      }

      setUploading(true);
      const uploadBody = new FormData();
      uploadBody.append("receiptFile", receiptFile);

      const uploadRes = await fetch("/api/payments/upload", {
        method: "POST",
        body: uploadBody,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        setError(uploadData.error || "Failed to upload receipt file");
        return;
      }

      const uploadedReceiptUrl = String(uploadData.url);

      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          receiptEvidence: uploadedReceiptUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit payment");
        return;
      }

      setPaymentStatus(data.status);
      setTransactionId("");
      setReceiptFile(null);
    } catch {
      setError("Network error - please try again");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  // If payment is verified, show success
  if (paymentStatus === "VERIFIED") {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <div>
            <h3 className="font-semibold text-green-300">Payment Verified</h3>
            <p className="text-sm text-green-200/90">
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
      <div className="rounded-lg border border-terminal-amber/40 bg-terminal-amber/10 p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-terminal-amber" />
          <div>
            <h3 className="font-semibold text-terminal-amber">Payment Pending</h3>
            <p className="text-sm text-terminal-amber/90">
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
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="font-semibold text-red-300">Payment Rejected</h3>
            <p className="text-sm text-red-200/90 mb-3">
              Your payment submission was rejected. Please resubmit with correct
              details.
            </p>
            <button
              onClick={() => setPaymentStatus(null)}
              className="text-sm font-medium text-red-300 hover:text-red-200 underline"
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
    <div className="rounded-xl border border-white/10 bg-black/50 p-6 backdrop-blur-md">
      <h2 className="text-xl font-semibold text-neutral-100 mb-4">Register Your Team</h2>
      <p className="text-neutral-300 text-sm mb-6">
        Pay with UPI and submit your transaction details. Once verified, your team can submit the project repository.
      </p>

      <div className="mb-6 grid gap-4 lg:grid-cols-[320px,1fr]">
        <div className="rounded-lg border border-phosphor/30 bg-black/60 p-3">
          <img src={QR_IMAGE_URL} alt="UPI payment QR code" className="mx-auto h-64 w-64 rounded-md border border-white/10 bg-white p-2" />
          <p className="mt-3 text-center text-xs text-neutral-400">Scan to pay via any UPI app</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/60 p-4 text-sm text-neutral-200">
          <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Payment Details</p>
          <div className="mt-3 space-y-2">
            <p>
              <span className="text-neutral-400">UPI ID:</span> <span className="font-semibold text-phosphor">{UPI_ID}</span>
            </p>
            <p>
              <span className="text-neutral-400">Registration Fee:</span> <span className="font-semibold text-phosphor">Rs {REGISTRATION_FEE}</span>
            </p>
            <p>
              <span className="text-neutral-400">Payment Note:</span> <span className="font-semibold text-phosphor">{PAYMENT_NOTE}</span>
            </p>
          </div>
          <a
            href={UPI_URI}
            className="mt-4 inline-flex rounded-md border border-phosphor/70 bg-phosphor/10 px-3 py-2 text-sm font-semibold text-phosphor transition hover:bg-phosphor/20"
          >
            Open UPI App
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Transaction ID *
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter UPI transaction ID"
            required
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Payment Receipt or Screenshot *
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            onChange={(e) =>
              setReceiptFile(e.target.files?.[0] ?? null)
            }
            required
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
          />
          <p className="text-xs text-neutral-400 mt-1">
            Upload image or PDF. Max file size: 5MB.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || uploading || !transactionId.trim() || !receiptFile}
          className="w-full rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? "Uploading receipt..." : loading ? "Submitting..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}
