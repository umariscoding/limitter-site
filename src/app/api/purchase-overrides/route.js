import { NextResponse } from 'next/server';
import { purchaseOverrides } from '../../../lib/firebase';

export async function POST(request) {
  try {
    const { userId, quantity, paymentData } = await request.json();

    if (!userId || !quantity || !paymentData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, quantity, and paymentData' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be between 1 and 100 overrides.' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing override purchase for user ${userId}: ${quantity} overrides`);

    // Process the override purchase
    const result = await purchaseOverrides(userId, quantity, paymentData);

    console.log(`✅ Override purchase completed:`, result);

    return NextResponse.json({
      success: true,
      purchase: {
        transactionId: result.transactionId,
        overridesAdded: result.overridesAdded,
        newOverrideBalance: result.newOverrideBalance,
        amount: result.amount,
        message: result.message
      }
    });

  } catch (error) {
    console.error('❌ Error processing override purchase:', error);
    
    return NextResponse.json(
      { error: 'Failed to process override purchase. Please try again.' },
      { status: 500 }
    );
  }
} 