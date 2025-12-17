import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify GST calculations
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = parseFloat(searchParams.get('amount') || '100');

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const baseAmount = amount;
  const gstPercentage = 2.00; // 2% GST
  
  // Frontend calculation (correct)
  const frontendGstAmount = (baseAmount * gstPercentage) / 100;
  const frontendTotal = baseAmount + frontendGstAmount;

  // Backend calculation (fixed)
  const backendGstAmount = Math.round((baseAmount * gstPercentage / 100) * 100) / 100;
  const backendTotal = parseFloat((baseAmount + backendGstAmount).toFixed(2));

  // Alternative calculation methods for comparison
  const simpleGstAmount = baseAmount * 0.02; // Direct 2% calculation
  const preciseGstAmount = Number((baseAmount * 0.02).toFixed(2));

  return NextResponse.json({
    input: {
      baseAmount,
      gstPercentage
    },
    calculations: {
      frontend: {
        gstAmount: frontendGstAmount,
        totalAmount: frontendTotal,
        formula: `${baseAmount} × ${gstPercentage}% = ${frontendGstAmount}`
      },
      backend: {
        gstAmount: backendGstAmount,
        totalAmount: backendTotal,
        formula: `Math.round((${baseAmount} × ${gstPercentage} / 100) × 100) / 100 = ${backendGstAmount}`
      },
      simple: {
        gstAmount: simpleGstAmount,
        totalAmount: baseAmount + simpleGstAmount,
        formula: `${baseAmount} × 0.02 = ${simpleGstAmount}`
      },
      precise: {
        gstAmount: preciseGstAmount,
        totalAmount: baseAmount + preciseGstAmount,
        formula: `Number((${baseAmount} × 0.02).toFixed(2)) = ${preciseGstAmount}`
      }
    },
    verification: {
      allMatch: frontendGstAmount === backendGstAmount && backendGstAmount === preciseGstAmount,
      differences: {
        frontendVsBackend: Math.abs(frontendGstAmount - backendGstAmount),
        backendVsPrecise: Math.abs(backendGstAmount - preciseGstAmount)
      }
    },
    examples: [
      { base: 100, gst: 2, total: 102 },
      { base: 500, gst: 10, total: 510 },
      { base: 1000, gst: 20, total: 1020 }
    ]
  });
}