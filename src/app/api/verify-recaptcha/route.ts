import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    const recaptchaSecretKey = process.env.RECAPTCHA_API_KEY;

    if (!recaptchaSecretKey) {
      console.error('reCAPTCHA secret key not configured');
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA not configured' },
        { status: 500 }
      );
    }

    // Verify token with Google reCAPTCHA API
    const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_RECAPTCHA_PROJECT_ID}/assessments?key=${recaptchaSecretKey}`;

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          token,
          siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          expectedAction: action || 'submit',
        },
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('reCAPTCHA verification failed:', verifyData);
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Check if the token is valid and score is acceptable
    const isValid = verifyData.tokenProperties?.valid === true;
    const score = verifyData.riskAnalysis?.score || 0;
    const actionMatch = verifyData.tokenProperties?.action === (action || 'submit');

    if (!isValid || !actionMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid reCAPTCHA token' },
        { status: 400 }
      );
    }

    // Score threshold: 0.5 or higher is considered human
    if (score < 0.5) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA score too low', score },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      score,
      action: verifyData.tokenProperties?.action,
    });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
