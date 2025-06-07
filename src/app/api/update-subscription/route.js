import { NextResponse } from 'next/server';
import { updateUserSubscription } from '../../../lib/firebase';

export async function POST(request) {
  try {
    const { plan, userId } = await request.json();

    // Validate required fields
    if (!plan || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: plan and userId' },
        { status: 400 }
      );
    }

    // Validate plan type
    const validPlans = ['pro', 'elite'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be either "pro" or "elite"' },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating subscription for user ${userId} to ${plan} plan`);

    // Update the user's subscription
    const updatedSubscription = await updateUserSubscription(userId, plan);

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