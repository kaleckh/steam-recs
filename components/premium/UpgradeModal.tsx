'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CREDIT_PACKAGES, CreditPackageId } from '@/lib/beta-limits';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function UpgradeModal({ isOpen, onClose, userId }: UpgradeModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackageId>('starter');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          packageId: selectedPackage,
          mode: 'payment', // One-time payment, not subscription
        }),
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

  const packages = Object.values(CREDIT_PACKAGES);
  const selected = CREDIT_PACKAGES[selectedPackage];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative terminal-box rounded-lg max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="terminal-header sticky top-0 z-10">
          <span className="text-gray-400 text-sm font-mono ml-16">BUY_CREDITS.exe</span>
          <button
            onClick={onClose}
            className="absolute right-4 top-3 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border-2 border-neon-orange mb-4">
              <svg className="w-8 h-8 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="orbitron text-2xl font-bold text-white mb-2">
              GET MORE SEARCHES
            </h2>
            <p className="text-gray-400 font-mono text-sm">
              Purchase AI search credits - use them anytime, they never expire
            </p>
          </div>

          {/* Package Selection */}
          <div className="space-y-3 mb-6">
            {packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              const pricePerSearch = (pkg.price / 100 / pkg.credits).toFixed(2);

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id as CreditPackageId)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-terminal-border hover:border-gray-600'
                  }`}
                >
                  {pkg.id === 'power' && (
                    <div className="absolute -top-2 right-3 px-2 py-0.5 bg-neon-green text-black text-[10px] font-mono font-bold rounded">
                      BEST VALUE
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-white font-bold">{pkg.name}</div>
                      <div className="text-gray-400 font-mono text-sm">
                        {pkg.credits} AI searches
                      </div>
                      <div className="text-gray-500 font-mono text-xs mt-1">
                        ${pricePerSearch} per search
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="orbitron text-2xl font-bold text-white">
                        {pkg.priceDisplay}
                      </div>
                      {pkg.id === 'power' && (
                        <div className="text-neon-green font-mono text-xs">
                          Save 25%
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* What you get */}
          <div className="bg-terminal-dark rounded-lg p-4 mb-6">
            <div className="text-gray-400 font-mono text-xs mb-3">WHAT YOU GET:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300 font-mono">AI-powered game discovery</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300 font-mono">Personalized recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300 font-mono">Credits never expire</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300 font-mono">No subscription required</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePurchase}
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
                BUY {selected.credits} SEARCHES - {selected.priceDisplay}
              </span>
            )}
          </button>

          <p className="text-center text-gray-600 font-mono text-xs mt-4">
            One-time purchase. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}
