import { NextResponse } from 'next/server';
import { checkOverrideEligibility, recordOverrideUsage, processOverridePayment } from '../../../lib/firebase';

export async function POST(request) {
  try {
    const { userId, paymentData, siteUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'Missing required field: siteUrl' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing override request for user: ${userId}, site: ${siteUrl}`);

    // Check eligibility first (now site-specific)
    const eligibility = await checkOverrideEligibility(userId, siteUrl);

    if (!eligibility.canOverride) {
      return NextResponse.json(
        { error: eligibility.reason || 'Override not allowed' },
        { status: 403 }
      );
    }

    let result;

    if (eligibility.requiresPayment) {
      // Process paid override (direct payment, not using credits)
      if (!paymentData) {
        return NextResponse.json(
          { error: 'Payment data required for paid override' },
          { status: 400 }
        );
      }

      result = await processOverridePayment(userId, {
        ...paymentData,
        amount: eligibility.price,
        reason: `Override for ${siteUrl || 'blocked site'}`
      }, siteUrl);
    } else if (eligibility.usePurchased) {
      // Process purchased override
      result = await recordOverrideUsage(userId, 'purchased', 0, siteUrl);
      result.transactionId = `purchased_${Date.now()}_${userId.substring(0, 8)}`;
      result.message = 'Purchased override used successfully';
    } else {
      // Process free override (plan includes free overrides)
      result = await recordOverrideUsage(userId, 'free', 0, siteUrl);
      result.transactionId = `free_${Date.now()}_${userId.substring(0, 8)}`;
      result.message = 'Free override granted successfully';
    }

    console.log(`✅ Override processed successfully:`, result);

    return NextResponse.json({
      success: true,
      override: {
        granted: true,
        transactionId: result.transactionId,
        amount: eligibility.price,
        isPaid: eligibility.requiresPayment,
        message: result.message,
        siteUrl: siteUrl
      },
      updatedStats: result.overrideStats || result.newStats
    });

  } catch (error) {
    console.error('❌ Error processing override:', error);
    
    return NextResponse.json(
      { error: 'Failed to process override. Please try again.' },
      { status: 500 }
    );
  }
} 