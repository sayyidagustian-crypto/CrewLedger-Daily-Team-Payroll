
interface FeatureFlags {
  promo_banner_active: boolean;
  showAds: boolean;
  showGlobalNotice: boolean;
  enableExperimentalFeature: boolean;
  enableBulkGenerate: boolean;
}

interface TuningValues {
  ad_unit_id: string;
  default_rate: number;
  globalNoticeMessage: string;
}

export interface RemoteConfig {
  feature_flags: FeatureFlags;
  tuning_values: TuningValues;
}

// Mocked/default config as a fallback, representing the local JSON payload.
const defaultConfig: RemoteConfig = {
  feature_flags: {
    promo_banner_active: false,
    showAds: false,
    showGlobalNotice: false,
    enableExperimentalFeature: false,
    enableBulkGenerate: true, // This flag now controls the bulk generate feature visibility
  },
  tuning_values: {
    ad_unit_id: "ca-app-pub-3940256099942544/6300978111", // Default test ID
    default_rate: 0.95,
    globalNoticeMessage: "",
  },
};

class RemoteConfigService {
  private config: RemoteConfig = defaultConfig;
  private initialized = false;

  public async fetchRemoteConfig(): Promise<void> {
    // As requested by the user, API calls are postponed.
    // The service will immediately use the default config.
    if (this.initialized) {
      return;
    }
    
    console.warn("Remote config fetch is disabled. Using default/mocked config.");
    this.config = defaultConfig;
    this.initialized = true;
  }

  public getConfig(): RemoteConfig {
    return this.config;
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.feature_flags[feature] ?? false;
  }

  public getTuningValue<T extends keyof TuningValues>(key: T): TuningValues[T] {
      return this.config.tuning_values[key];
  }
}

// Export a singleton instance for global use.
export const remoteConfigService = new RemoteConfigService();
