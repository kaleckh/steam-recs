'use client';

import { useState } from 'react';
import { PLANS } from '@/lib/plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function UpgradeModal({ isOpen, onClose, userId }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceType: selectedPlan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const yearlyDiscount = Math.round((1 - (PLANS.premium.yearlyPrice / (PLANS.premium.monthlyPrice * 12))) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative terminal-box rounded-lg max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">UPGRADE_TO_PRO.exe</span>
          <button
            onClick={onClose}
            className="absolute right-4 top-3 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border-2 border-neon-orange mb-4">
              <svg className="w-8 h-8 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="orbitron text-2xl font-bold text-white mb-2">
              UNLOCK PRO FEATURES
            </h2>
            <p className="text-gray-400 font-mono text-sm">
              Get unlimited access to all premium features
            </p>
          </div>

          {/* Plan Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-neon-cyan bg-neon-cyan/10'
                  : 'border-terminal-border hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-mono text-gray-400 mb-1">Monthly</div>
              <div className="orbitron text-2xl font-bold text-white">
                ${PLANS.premium.monthlyPrice}
                <span className="text-sm text-gray-500">/mo</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-neon-green bg-neon-green/10'
                  : 'border-terminal-border hover:border-gray-600'
              }`}
            >
              <div className="absolute -top-2 right-2 px-2 py-0.5 bg-neon-green text-black text-[10px] font-mono font-bold rounded">
                SAVE {yearlyDiscount}%
              </div>
              <div className="text-sm font-mono text-gray-400 mb-1">Yearly</div>
              <div className="orbitron text-2xl font-bold text-white">
                ${PLANS.premium.yearlyPrice}
                <span className="text-sm text-gray-500">/yr</span>
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {PLANS.premium.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300 font-mono text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full btn-arcade rounded-lg py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span>
                UPGRADE NOW - ${selectedPlan === 'yearly' ? PLANS.premium.yearlyPrice : PLANS.premium.monthlyPrice}
                {selectedPlan === 'yearly' ? '/year' : '/month'}
              </span>
            )}
          </button>

          <p className="text-center text-gray-600 font-mono text-xs mt-4">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
