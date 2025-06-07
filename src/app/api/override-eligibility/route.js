import { NextResponse } from 'next/server';
import { checkOverrideEligibility } from '../../../lib/firebase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const siteUrl = searchParams.get('siteUrl');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: siteUrl' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking override eligibility for user: ${userId}, site: ${siteUrl}`);

    const eligibility = await checkOverrideEligibility(userId, siteUrl);

    console.log(`✅ Override eligibility checked:`, eligibility);

    return NextResponse.json({
      success: true,
      eligibility
    });

  } catch (error) {
    console.error('❌ Error checking override eligibility:', error);
    
    return NextResponse.json(
      { error: 'Failed to check override eligibility. Please try again.' },
      { status: 500 }
    );
  }
} 