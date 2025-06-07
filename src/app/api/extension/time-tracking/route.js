import { updateSiteTimeTracking, getUserSitesTimeStatus, resetDailySiteTimes } from '../../../../lib/firebase';

// Handle POST requests from Chrome extension
export async function POST(request) {
  try {
    const { action, userId, siteId, timeSpentSeconds, url } = await request.json();

    switch (action) {
      case 'updateTime':
        if (!siteId || !timeSpentSeconds) {
          return Response.json({ error: 'Missing siteId or timeSpentSeconds' }, { status: 400 });
        }
        
        const result = await updateSiteTimeTracking(siteId, timeSpentSeconds);
        return Response.json({ 
          success: true, 
          data: result 
        });

      case 'getSitesStatus':
        if (!userId) {
          return Response.json({ error: 'Missing userId' }, { status: 400 });
        }
        
        const sitesStatus = await getUserSitesTimeStatus(userId);
        return Response.json({ 
          success: true, 
          data: sitesStatus 
        });

      case 'resetDaily':
        if (!userId) {
          return Response.json({ error: 'Missing userId' }, { status: 400 });
        }
        
        const resetCount = await resetDailySiteTimes(userId);
        return Response.json({ 
          success: true, 
          resetCount 
        });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests (for getting sites status)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const sitesStatus = await getUserSitesTimeStatus(userId);
    return Response.json({ 
      success: true, 
      data: sitesStatus 
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
} 