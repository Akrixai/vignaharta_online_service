'use client';

import { useRef, useEffect, useState } from 'react';
import { showToast } from '@/lib/toast';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
  applicationId: string;
  cashbackAmount: number;
  cashbackPercentage: number;
  onReveal: () => void;
}

export default function ScratchCard({
  applicationId,
  cashbackAmount,
  cashbackPercentage,
  onReveal,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw scratch layer
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add scratch pattern
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁 SCRATCH HERE 🎁', canvas.width / 2, canvas.height / 2);
  }, []);

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed || isProcessing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Erase the scratch layer
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check if enough is scratched
    checkScratchProgress(ctx, canvas);
  };

  const checkScratchProgress = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const scratchedPercentage = (transparent / (pixels.length / 4)) * 100;

    if (scratchedPercentage > 50 && !isRevealed) {
      revealCashback();
    }
  };

  const revealCashback = async () => {
    setIsRevealed(true);
    setIsProcessing(true);

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    });

    try {
      const response = await fetch(`/api/applications/${applicationId}/reveal-cashback`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast.success('🎉 Cashback Revealed!', {
          description: `₹${cashbackAmount.toFixed(2)} has been added to your wallet!`,
        });
        onReveal();
      } else {
        showToast.error('Failed to claim cashback', {
          description: data.error || 'Please try again',
        });
      }
    } catch (error) {
      showToast.error('Error claiming cashback', {
        description: 'Please contact support',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Background card with cashback amount */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 shadow-2xl">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
          <p className="text-lg mb-4">You've earned cashback!</p>
          <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-5xl font-bold mb-2">₹{cashbackAmount.toFixed(2)}</div>
            <div className="text-xl">{cashbackPercentage.toFixed(2)}% Cashback</div>
          </div>
        </div>
      </div>

      {/* Scratch layer */}
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-2xl cursor-pointer"
          onMouseDown={() => setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseMove={(e) => isScratching && scratch(e)}
          onTouchStart={() => setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={(e) => isScratching && scratch(e)}
        />
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Adding to wallet...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isRevealed && !isProcessing && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            👆 Scratch the card to reveal your cashback!
          </p>
        </div>
      )}
    </div>
  );
}
