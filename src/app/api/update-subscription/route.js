import { NextResponse } from 'next/server';
import { updateUserSubscription } from '../../../lib/firebase';

export async function POST(request) {
  try {
    const { plan, userId, paymentData } = await request.json();
console.log("🔄 Payment data received:", paymentData);
    // Validate required fields
    if (!plan || !userId || !paymentData) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, userId, and paymentData' },
        { status: 400 }
      );
    }
    console.log("🔄 Plan received:", plan);
    console.log("🔄 User ID received:", userId);
    console.log("🔄 Payment data received:", paymentData);
    // Validate plan type
    const validPlans = ['pro', 'elite'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be either "pro" or "elite"' },
        { status: 400 }
      );
    }

    // Validate payment data
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.nameOnCard) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating subscription for user ${userId} to ${plan} plan`);

    // Update the user's subscription with payment data
    const updatedSubscription = await updateUserSubscription(userId, plan, paymentData);

    console.log(`✅ Subscription updated successfully:`, updatedSubscription);

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: `Successfully upgraded to ${plan} plan!`
    });

  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    
    return NextResponse.json(
      { error: 'Failed to update subscription. Please try again.' },
      { status: 500 }
    );
  }
} 