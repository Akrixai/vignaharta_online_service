'use client';

import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ScratchCardProps {
  cashbackPercentage: number;
  cashbackAmount: number;
  onReveal: () => Promise<void>;
  revealed?: boolean;
}

export default function ScratchCard({ 
  cashbackPercentage, 
  cashbackAmount, 
  onReveal,
  revealed = false 
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(revealed);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw scratch-off layer
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern
    ctx.fillStyle = '#c0392b';
    for (let i = 0; i < canvas.width; i += 20) {
      for (let j = 0; j < canvas.height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }

    // Add text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px Arial';
    ctx.fillText('to reveal your cashback!', canvas.width / 2, canvas.height / 2 + 10);
  }, [isRevealed]);

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isRevealed || isProcessing) return;

    const canvas = canvasRef.current;
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

    // Scale coordinates
    x = (x / rect.width) * canvas.width;
    y = (y / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percentage = (transparent / (pixels.length / 4)) * 100;
    setScratchPercentage(percentage);

    // Auto-reveal when 50% scratched
    if (percentage > 50 && !isRevealed) {
      handleReveal();
    }
  };

  const handleReveal = async () => {
    if (isProcessing || isRevealed) return;
    
    setIsProcessing(true);
    try {
      await onReveal();
      setIsRevealed(true);
    } catch (error) {
      console.error('Failed to reveal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isRevealed) {
    return (
      <div className="relative w-full h-64 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <div className="text-2xl font-bold mb-2">Congratulations!</div>
          <div className="text-5xl font-black mb-2">{cashbackPercentage}%</div>
          <div className="text-xl mb-4">Cashback Earned!</div>
          <div className="text-3xl font-bold bg-white text-green-600 px-6 py-3 rounded-lg shadow-lg">
            {formatCurrency(cashbackAmount)}
          </div>
          <div className="mt-4 text-sm opacity-90">
            ✅ Credited to your wallet
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-2xl overflow-hidden">
      {/* Hidden content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
        <div className="text-6xl mb-4">🎁</div>
        <div className="text-2xl font-bold mb-2">Your Cashback</div>
        <div className="text-5xl font-black mb-2">{cashbackPercentage}%</div>
        <div className="text-3xl font-bold">{formatCurrency(cashbackAmount)}</div>
      </div>

      {/* Scratch layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none"
        onMouseDown={() => setIsScratching(true)}
        onMouseUp={() => setIsScratching(false)}
        onMouseMove={(e) => isScratching && scratch(e)}
        onTouchStart={() => setIsScratching(true)}
        onTouchEnd={() => setIsScratching(false)}
        onTouchMove={(e) => scratch(e)}
      />

      {/* Progress indicator */}
      {scratchPercentage > 0 && scratchPercentage < 50 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-800">
          {Math.round(scratchPercentage)}% scratched
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={handleReveal}
        disabled={isProcessing}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors disabled:opacity-50"
      >
        {isProcessing ? 'Revealing...' : 'Skip & Reveal'}
      </button>
    </div>
  );
}
