import { supabase } from './supabase';

const SESSION_STORAGE_KEY = 'kroniq_session_id';
const SESSION_START_KEY = 'kroniq_session_start';

export interface PageVisitData {
  pageName: string;
  referrer?: string;
}

export interface AnalyticsEventData {
  eventType: string;
  eventName: string;
  eventData?: Record<string, any>;
  pageName: string;
}

export interface ConversionFunnelUpdate {
  getStartedClicked?: boolean;
  signupPageViewed?: boolean;
  signupCompleted?: boolean;
  userId?: string;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
  }

  return sessionId;
}

function getBrowserInfo() {
  if (typeof window === 'undefined') return {};

  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    referrer: document.referrer || null,
  };
}

export async function trackPageVisit(data: PageVisitData): Promise<void> {
  try {
    const sessionId = getSessionId();
    const browserInfo = getBrowserInfo();

    const { error } = await supabase.from('page_visits').insert({
      session_id: sessionId,
      page_name: data.pageName,
      referrer: data.referrer || browserInfo.referrer,
      user_agent: browserInfo.userAgent,
      screen_width: browserInfo.screenWidth,
      screen_height: browserInfo.screenHeight,
      visited_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error tracking page visit:', error);
    }

    await initializeConversionFunnel(sessionId, data.referrer || browserInfo.referrer);
  } catch (error) {
    console.error('Error in trackPageVisit:', error);
  }
}

async function initializeConversionFunnel(sessionId: string, referrer?: string | null): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('conversion_funnel')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('conversion_funnel').insert({
        session_id: sessionId,
        first_visit_at: new Date().toISOString(),
        referrer_source: referrer,
        converted: false,
      });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error initializing conversion funnel:', error);
      }
    }
  } catch (error) {
    console.error('Error in initializeConversionFunnel:', error);
  }
}

export async function trackEvent(data: AnalyticsEventData): Promise<void> {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase.from('analytics_events').insert({
      session_id: sessionId,
      event_type: data.eventType,
      event_name: data.eventName,
      event_data: data.eventData || null,
      page_name: data.pageName,
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error tracking event:', error);
    }
  } catch (error) {
    console.error('Error in trackEvent:', error);
  }
}

export async function updateConversionFunnel(update: ConversionFunnelUpdate): Promise<void> {
  try {
    const sessionId = getSessionId();

    const { data: funnel } = await supabase
      .from('conversion_funnel')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!funnel) {
      await initializeConversionFunnel(sessionId);
    }

    const updateData: Record<string, any> = {};

    if (update.getStartedClicked) {
      updateData.get_started_clicked_at = new Date().toISOString();
    }

    if (update.signupPageViewed) {
      updateData.signup_page_viewed_at = new Date().toISOString();
    }

    if (update.signupCompleted) {
      updateData.signup_completed_at = new Date().toISOString();
      updateData.converted = true;
      if (update.userId) {
        updateData.user_id = update.userId;
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('conversion_funnel')
        .update(updateData)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating conversion funnel:', error);
      }
    }
  } catch (error) {
    console.error('Error in updateConversionFunnel:', error);
  }
}

export async function linkSessionToUser(userId: string): Promise<void> {
  try {
    const sessionId = getSessionId();

    await Promise.all([
      supabase
        .from('page_visits')
        .update({ user_id: userId })
        .eq('session_id', sessionId)
        .is('user_id', null),

      supabase
        .from('analytics_events')
        .update({ user_id: userId })
        .eq('session_id', sessionId)
        .is('user_id', null),

      supabase
        .from('conversion_funnel')
        .update({ user_id: userId })
        .eq('session_id', sessionId),
    ]);
  } catch (error) {
    console.error('Error linking session to user:', error);
  }
}

export async function trackGetStartedClick(pageName: string): Promise<void> {
  await trackEvent({
    eventType: 'button_click',
    eventName: 'get_started_clicked',
    eventData: { from_page: pageName },
    pageName,
  });

  await updateConversionFunnel({ getStartedClicked: true });
}

export async function trackSignupPageView(): Promise<void> {
  await trackPageVisit({ pageName: 'signup' });
  await updateConversionFunnel({ signupPageViewed: true });
}

export async function trackSignupComplete(userId: string): Promise<void> {
  await trackEvent({
    eventType: 'signup',
    eventName: 'signup_completed',
    pageName: 'signup',
  });

  await updateConversionFunnel({
    signupCompleted: true,
    userId,
  });

  await linkSessionToUser(userId);
}

export async function getAnalyticsSummary(startDate?: Date, endDate?: Date) {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const [visitorsResult, signupsResult, funnelResult] = await Promise.all([
      supabase
        .from('page_visits')
        .select('session_id', { count: 'exact', head: false })
        .gte('visited_at', start.toISOString())
        .lte('visited_at', end.toISOString()),

      supabase
        .from('conversion_funnel')
        .select('*', { count: 'exact' })
        .eq('converted', true)
        .gte('first_visit_at', start.toISOString())
        .lte('first_visit_at', end.toISOString()),

      supabase
        .from('conversion_funnel')
        .select('*')
        .gte('first_visit_at', start.toISOString())
        .lte('first_visit_at', end.toISOString()),
    ]);

    const uniqueVisitors = new Set(
      visitorsResult.data?.map((v: any) => v.session_id) || []
    ).size;

    const totalSignups = signupsResult.count || 0;
    const conversionRate = uniqueVisitors > 0
      ? ((totalSignups / uniqueVisitors) * 100).toFixed(2)
      : '0.00';

    const funnelData = funnelResult.data || [];
    const getStartedClicks = funnelData.filter(
      (f: any) => f.get_started_clicked_at
    ).length;
    const signupPageViews = funnelData.filter(
      (f: any) => f.signup_page_viewed_at
    ).length;

    const avgTimeToConversion = funnelData
      .filter((f: any) => f.time_to_conversion_seconds)
      .reduce((sum: number, f: any) => sum + f.time_to_conversion_seconds, 0) /
      (totalSignups || 1);

    return {
      totalVisitors: uniqueVisitors,
      totalSignups,
      conversionRate: parseFloat(conversionRate),
      getStartedClicks,
      signupPageViews,
      avgTimeToConversionMinutes: Math.round(avgTimeToConversion / 60),
      funnel: {
        visitors: uniqueVisitors,
        getStartedClicks,
        signupPageViews,
        signups: totalSignups,
      },
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return {
      totalVisitors: 0,
      totalSignups: 0,
      conversionRate: 0,
      getStartedClicks: 0,
      signupPageViews: 0,
      avgTimeToConversionMinutes: 0,
      funnel: {
        visitors: 0,
        getStartedClicks: 0,
        signupPageViews: 0,
        signups: 0,
      },
    };
  }
}

export async function getTopPages(startDate?: Date, endDate?: Date) {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data, error } = await supabase
      .from('page_visits')
      .select('page_name')
      .gte('visited_at', start.toISOString())
      .lte('visited_at', end.toISOString());

    if (error) throw error;

    const pageCounts = (data || []).reduce((acc: Record<string, number>, visit: any) => {
      acc[visit.page_name] = (acc[visit.page_name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(pageCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting top pages:', error);
    return [];
  }
}

export async function getDailyVisitors(days: number = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('page_visits')
      .select('visited_at, session_id')
      .gte('visited_at', startDate.toISOString())
      .order('visited_at', { ascending: true });

    if (error) throw error;

    const dailyData = (data || []).reduce((acc: Record<string, Set<string>>, visit: any) => {
      const date = new Date(visit.visited_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(visit.session_id);
      return acc;
    }, {});

    return Object.entries(dailyData)
      .map(([date, sessions]) => ({
        date,
        visitors: sessions.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting daily visitors:', error);
    return [];
  }
}
