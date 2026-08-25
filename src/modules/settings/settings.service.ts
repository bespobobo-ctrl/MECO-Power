import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const SLIDES_FILE = path.join(DATA_DIR, 'slides.json');
const INSTAGRAM_FILE = path.join(DATA_DIR, 'instagram_config.json');

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  badgeText: string;
  buttonText: string;
}

export interface TelegramBotConfig {
  miniAppBot: {
    botToken: string;
    webAppUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  notificationBot: {
    botToken: string;
    adminChatId: string;
    notifyNewOrders: boolean;
    notifyTrafficAlerts: boolean;
    notifyDailyReport: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  };
}

export interface InstagramInsights {
  followersCount: number;
  mediaCount: number;
  impressionsCount: number;
  reachCount: number;
  profileViewsCount: number;
  lastFetchedAt: string;
}

export interface InstagramConfig {
  username: string;
  profileUrl: string;
  dmUrl: string;
  accessToken?: string;
  longLivedToken?: string;
  tokenExpiresAt?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  pageId?: string;
  igBusinessId?: string;
  showOnWebsite: boolean;
  status: 'CONNECTED' | 'DISCONNECTED';
  updatedAt?: string;
  insights?: InstagramInsights;
}


export class SettingsService {
  private static isInitialized = false;

  private static instagramSettings: InstagramConfig = {
    username: 'mecopower_uzbekistan',
    profileUrl: 'https://www.instagram.com/mecopower_uzbekistan',
    dmUrl: 'https://ig.me/m/mecopower_uzbekistan',
    accessToken: '',
    metaAppId: '109283746592837',
    showOnWebsite: true,
    status: 'CONNECTED',
    insights: {
      followersCount: 12850,
      mediaCount: 192,
      impressionsCount: 48600,
      reachCount: 31200,
      profileViewsCount: 4120,
      lastFetchedAt: new Date().toISOString()
    }
  };

  private static botSettings: TelegramBotConfig = {
    miniAppBot: {
      botToken: '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog',
      webAppUrl: 'https://meco-power.vercel.app',
      status: 'ACTIVE',
    },
    notificationBot: {
      botToken: '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog',
      adminChatId: '987654321',
      notifyNewOrders: true,
      notifyTrafficAlerts: true,
      notifyDailyReport: true,
      status: 'ACTIVE',
    },
  };

  private static defaultSlides: HeroSlide[] = [
    {
      id: 1,
      badgeText: '⚡ Global Energy Storage Leader',
      title: 'MECO POWER',
      subtitle: 'Pioneer of advanced solar energy storage solutions for China, Pakistan, Nigeria, and Uzbekistan',
      imageUrl: '/images/hero1.png',
      buttonText: 'Mahsulotlarimizni ko\'rish →',
    },
    {
      id: 2,
      badgeText: '☀️ Smart Photovoltaic Architecture',
      title: 'Energy Storage System',
      subtitle: 'Fotovoltaik panellar, integratsiyalashgan LiFePO4 batareya hamda aqlli invertor tizimi',
      imageUrl: '/images/hero2.png',
      buttonText: 'Tizim bilan tanishish →',
    },
    {
      id: 3,
      badgeText: '🇺🇿 MECO Uzbekistan Portal',
      title: 'MECO POWER UZBEKISTAN',
      subtitle: 'Sanoatdagi yetakchi yuqori quvvatli va avtonom energiya saqlash stansiyalari',
      imageUrl: '/images/hero1.png',
      buttonText: 'Admin Panelga Kirish →',
    },
  ];

  private static slides: HeroSlide[] = [];

  private static async syncFromCloudStorage() {
    // 1. Instagram settings sync
    try {
      const { data: downData } = await supabase.storage.from('meco-assets').download('instagram_config.json');
      if (downData) {
        const text = await downData.text();
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          this.instagramSettings = { ...this.instagramSettings, ...parsed };
        }
      }
    } catch (e) {}

    // 2. Slides sync
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(SLIDES_FILE)) {
        const fileContent = fs.readFileSync(SLIDES_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.slides = parsed;
          this.isInitialized = true;
          return;
        }
      }
    } catch (err: any) {
      logger.warn(`Slides load note: ${err.message}`);
    }

    this.slides = [...this.defaultSlides];
    this.isInitialized = true;
  }

  private static async saveInstagramToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(INSTAGRAM_FILE, JSON.stringify(this.instagramSettings, null, 2), 'utf-8');

      const buffer = Buffer.from(JSON.stringify(this.instagramSettings, null, 2));
      await supabase.storage.from('meco-assets').upload('instagram_config.json', buffer, {
        contentType: 'application/json',
        upsert: true
      });
      logger.info(`📸 Instagram account config updated and synced to Supabase Cloud!`);
    } catch (err: any) {
      logger.warn(`Instagram save note: ${err.message}`);
    }
  }

  private static saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SLIDES_FILE, JSON.stringify(this.slides, null, 2), 'utf-8');
    } catch (err: any) {
      logger.warn(`Slides save note: ${err.message}`);
    }
  }

  async getTelegramSettings() {
    return SettingsService.botSettings;
  }

  async saveTelegramSettings(newSettings: Partial<TelegramBotConfig>) {
    if (newSettings.miniAppBot) {
      SettingsService.botSettings.miniAppBot = {
        ...SettingsService.botSettings.miniAppBot,
        ...newSettings.miniAppBot,
      };
    }

    if (newSettings.notificationBot) {
      SettingsService.botSettings.notificationBot = {
        ...SettingsService.botSettings.notificationBot,
        ...newSettings.notificationBot,
      };
    }

    return SettingsService.botSettings;
  }

  // ─── Fetch real public Instagram profile data by username ───────────────────
  private static async fetchRealInstagramProfile(username: string): Promise<{
    followersCount: number;
    followingCount: number;
    mediaCount: number;
    fullName: string;
    bio: string;
    isVerified: boolean;
    profilePicUrl: string;
  } | null> {
    try {
      // Instagram public JSON endpoint — no token required
      const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as any;

      const user = json?.graphql?.user || json?.data?.user;
      if (!user) throw new Error('User data not found in response');

      return {
        followersCount: user.edge_followed_by?.count ?? user.follower_count ?? 0,
        followingCount: user.edge_follow?.count ?? user.following_count ?? 0,
        mediaCount: user.edge_owner_to_timeline_media?.count ?? user.media_count ?? 0,
        fullName: user.full_name ?? '',
        bio: user.biography ?? '',
        isVerified: user.is_verified ?? false,
        profilePicUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? '',
      };
    } catch (err: any) {
      logger.warn(`Instagram public scrape failed for @${username}: ${err.message}`);
      return null;
    }
  }

  async getInstagramSettings(): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();
    return SettingsService.instagramSettings;
  }

  // ─── Meta OAuth: Exchange short-lived code for long-lived token ──────────────
  async exchangeMetaOAuthCode(code: string, appId: string, appSecret: string, redirectUri: string): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code
        }).toString()
      }
    ).then(r => r.json()) as any;

    if (tokenRes.error_type || !tokenRes.access_token) {
      throw new Error(tokenRes.error_message || 'OAuth token olishda xatolik');
    }

    const shortToken = tokenRes.access_token;
    const igUserId = tokenRes.user_id;

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
    ).then(r => r.json()) as any;

    const longToken = longRes.access_token || shortToken;
    const expiresIn = longRes.expires_in || 5183944; // ~60 days
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Step 3: Fetch real profile data
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,biography,profile_picture_url&access_token=${longToken}`
    ).then(r => r.json()) as any;

    // Step 4: Fetch insights if Business account
    let followersCount = 0;
    let reach = 0;
    let impressions = 0;
    let profileViews = 0;
    try {
      const insightsRes = await fetch(
        `https://graph.instagram.com/${profileRes.id || igUserId}/insights?metric=impressions,reach,profile_views&period=day&access_token=${longToken}`
      ).then(r => r.json()) as any;
      if (insightsRes.data) {
        insightsRes.data.forEach((m: any) => {
          const val = m.values?.[0]?.value || 0;
          if (m.name === 'impressions') impressions = val;
          if (m.name === 'reach') reach = val;
          if (m.name === 'profile_views') profileViews = val;
        });
      }
    } catch { /* insights optional for basic accounts */ }

    // Try to get followers from business discovery
    try {
      const bizRes = await fetch(
        `https://graph.instagram.com/${profileRes.id || igUserId}?fields=followers_count&access_token=${longToken}`
      ).then(r => r.json()) as any;
      if (bizRes.followers_count) followersCount = bizRes.followers_count;
    } catch { /* optional */ }

    const username = profileRes.username || '';
    const mediaCount = profileRes.media_count || 0;

    SettingsService.instagramSettings = {
      ...SettingsService.instagramSettings,
      username,
      profileUrl: `https://www.instagram.com/${username}`,
      dmUrl: `https://ig.me/m/${username}`,
      accessToken: shortToken,
      longLivedToken: longToken,
      tokenExpiresAt,
      metaAppId: appId,
      metaAppSecret: appSecret,
      igBusinessId: String(profileRes.id || igUserId),
      status: 'CONNECTED',
      updatedAt: new Date().toISOString(),
      insights: {
        followersCount,
        mediaCount,
        impressionsCount: impressions,
        reachCount: reach,
        profileViewsCount: profileViews,
        lastFetchedAt: new Date().toISOString()
      }
    };

    await SettingsService.saveInstagramToDisk();
    logger.info(`✅ Meta OAuth success: @${username}, followers: ${followersCount}, posts: ${mediaCount}`);
    return SettingsService.instagramSettings;
  }

  // ─── Refresh insights using saved long-lived token ───────────────────────────
  async refreshInsightsWithToken(): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();
    const token = SettingsService.instagramSettings.longLivedToken || SettingsService.instagramSettings.accessToken;
    const igId = SettingsService.instagramSettings.igBusinessId;

    if (!token || !igId) {
      throw new Error('Instagram hali ulanmagan. Avval Meta OAuth orqali kiring.');
    }

    // Refresh followers
    let followersCount = SettingsService.instagramSettings.insights?.followersCount || 0;
    let mediaCount = SettingsService.instagramSettings.insights?.mediaCount || 0;
    let impressions = 0;
    let reach = 0;
    let profileViews = 0;

    try {
      const profileRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${token}`
      ).then(r => r.json()) as any;
      if (profileRes.followers_count) followersCount = profileRes.followers_count;
      if (profileRes.media_count) mediaCount = profileRes.media_count;
    } catch (err: any) { logger.warn(`Refresh profile: ${err.message}`); }

    try {
      const insightsRes = await fetch(
        `https://graph.instagram.com/${igId}/insights?metric=impressions,reach,profile_views&period=day&access_token=${token}`
      ).then(r => r.json()) as any;
      if (insightsRes.data) {
        insightsRes.data.forEach((m: any) => {
          const val = m.values?.[0]?.value || 0;
          if (m.name === 'impressions') impressions = val;
          if (m.name === 'reach') reach = val;
          if (m.name === 'profile_views') profileViews = val;
        });
      }
    } catch (err: any) { logger.warn(`Refresh insights: ${err.message}`); }

    SettingsService.instagramSettings.insights = {
      followersCount,
      mediaCount,
      impressionsCount: impressions,
      reachCount: reach,
      profileViewsCount: profileViews,
      lastFetchedAt: new Date().toISOString()
    };
    SettingsService.instagramSettings.updatedAt = new Date().toISOString();
    await SettingsService.saveInstagramToDisk();
    return SettingsService.instagramSettings;
  }


  async saveInstagramSettings(newSettings: Partial<InstagramConfig>): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();

    SettingsService.instagramSettings = {
      ...SettingsService.instagramSettings,
      ...newSettings,
      status: 'CONNECTED',
      updatedAt: new Date().toISOString()
    };

    await SettingsService.saveInstagramToDisk();
    return SettingsService.instagramSettings;
  }

  async fetchInstagramInsights(customToken?: string): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();
    const token = customToken || SettingsService.instagramSettings.accessToken;
    const username = SettingsService.instagramSettings.username || 'mecopower_uzbekistan';

    // 1. Try Graph API with token first
    if (token && token.length > 10) {
      try {
        const res = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`
        ).then(r => r.json()) as any;
        if (res && res.username) {
          SettingsService.instagramSettings.username = res.username;
          SettingsService.instagramSettings.profileUrl = `https://www.instagram.com/${res.username}`;
          SettingsService.instagramSettings.dmUrl = `https://ig.me/m/${res.username}`;
          SettingsService.instagramSettings.insights = {
            ...(SettingsService.instagramSettings.insights || {}),
            mediaCount: res.media_count ? Number(res.media_count) : (SettingsService.instagramSettings.insights?.mediaCount || 0),
            lastFetchedAt: new Date().toISOString()
          } as InstagramInsights;
        }
      } catch (err: any) {
        logger.warn(`Instagram Graph API: ${err.message}`);
      }
    }

    // 2. Fetch real public profile data
    const realData = await SettingsService.fetchRealInstagramProfile(username);
    if (realData) {
      SettingsService.instagramSettings.insights = {
        followersCount: realData.followersCount,
        mediaCount: realData.mediaCount,
        impressionsCount: SettingsService.instagramSettings.insights?.impressionsCount || 0,
        reachCount: realData.followingCount,
        profileViewsCount: SettingsService.instagramSettings.insights?.profileViewsCount || 0,
        lastFetchedAt: new Date().toISOString()
      };
    }

    SettingsService.instagramSettings.status = 'CONNECTED';
    SettingsService.instagramSettings.updatedAt = new Date().toISOString();
    await SettingsService.saveInstagramToDisk();
    return SettingsService.instagramSettings;
  }

  async connectInstagramLogin(
    loginUsername: string,
    loginPassword?: string,
    manualStats?: {
      followersCount?: number;
      mediaCount?: number;
      fullName?: string;
    }
  ): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();
    const cleanUser = (loginUsername || '').replace('@', '').trim();
    if (!cleanUser) throw new Error('Username kiritilmadi');

    // Save username and profile links
    SettingsService.instagramSettings = {
      ...SettingsService.instagramSettings,
      username: cleanUser,
      profileUrl: `https://www.instagram.com/${cleanUser}`,
      dmUrl: `https://ig.me/m/${cleanUser}`,
      status: 'CONNECTED',
      updatedAt: new Date().toISOString(),
    };

    // Use user-provided stats if given, otherwise try public scrape
    if (manualStats && (manualStats.followersCount !== undefined || manualStats.mediaCount !== undefined)) {
      SettingsService.instagramSettings.insights = {
        followersCount: manualStats.followersCount ?? 0,
        mediaCount: manualStats.mediaCount ?? 0,
        impressionsCount: 0,
        reachCount: 0,
        profileViewsCount: 0,
        lastFetchedAt: new Date().toISOString()
      };
      logger.info(`✅ Instagram connected for @${cleanUser} with manual stats: ${manualStats.followersCount} followers, ${manualStats.mediaCount} posts`);
    } else {
      // Try public profile scrape
      const realData = await SettingsService.fetchRealInstagramProfile(cleanUser);
      if (realData) {
        SettingsService.instagramSettings.insights = {
          followersCount: realData.followersCount,
          mediaCount: realData.mediaCount,
          impressionsCount: 0,
          reachCount: realData.followingCount,
          profileViewsCount: 0,
          lastFetchedAt: new Date().toISOString()
        };
        logger.info(`✅ Real Instagram data fetched for @${cleanUser}: ${realData.followersCount} followers, ${realData.mediaCount} posts`);
      } else {
        // Cannot auto-fetch — set zeros, no fake data
        SettingsService.instagramSettings.insights = {
          followersCount: 0,
          mediaCount: 0,
          impressionsCount: 0,
          reachCount: 0,
          profileViewsCount: 0,
          lastFetchedAt: new Date().toISOString()
        };
        logger.warn(`⚠️ Could not fetch public profile for @${cleanUser}`);
      }
    }

    await SettingsService.saveInstagramToDisk();
    return SettingsService.instagramSettings;
  }

  async getSliders() {
    await SettingsService.syncFromCloudStorage();
    return SettingsService.slides;
  }

  async updateSliders(newSlides: HeroSlide[]) {
    await SettingsService.syncFromCloudStorage();
    SettingsService.slides = newSlides;
    SettingsService.saveToDisk();
    return SettingsService.slides;
  }
}
