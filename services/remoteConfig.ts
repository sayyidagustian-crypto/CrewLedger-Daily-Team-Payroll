
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
  admin_access_codes: string[];
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
    admin_access_codes: [], // The one-time codes are now managed here
  },
};

const CONFIG_STORAGE_KEY = 'crewledger_remote_config';
// PENTING: URL konfigurasi sekarang di-encode dalam Base64 untuk membuatnya tidak mudah ditemukan.
// Ganti URL placeholder di bawah ini dengan URL Gist Raw Anda yang sebenarnya,
// lalu encode kembali ke Base64 (Anda bisa menggunakan alat online untuk ini).
// Nilai saat ini adalah hasil encode Base64 dari:
// 'https://gist.githubusercontent.com/anonymous/12345/raw/config.json'
const ENCODED_REMOTE_CONFIG_URL = 'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hbm9ueW1vdXMvMTIzNDUvcmF3L2NvbmZpZy5qc29u';

class RemoteConfigService {
  private config: RemoteConfig = defaultConfig;
  private initialized = false;

  constructor() {
    // Muat konfigurasi dari cache saat inisialisasi untuk dukungan offline
    const cachedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (cachedConfig) {
        try {
            this.config = JSON.parse(cachedConfig);
        } catch (e) {
            console.error("Gagal memuat konfigurasi dari cache", e);
            // Kembali ke default jika cache rusak
            this.config = defaultConfig;
        }
    }
  }

  /**
   * Decodes the Base64 encoded URL at runtime.
   * @returns The decoded URL string.
   */
  private getRemoteConfigUrl(): string {
    try {
      // Decode the URL at runtime.
      return atob(ENCODED_REMOTE_CONFIG_URL);
    } catch (e) {
      console.error("Gagal men-decode URL konfigurasi remote.", e);
      // Mengembalikan URL yang tidak valid untuk mencegah pengambilan yang tidak disengaja
      return '';
    }
  }

  public async fetchRemoteConfig(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const remoteUrl = this.getRemoteConfigUrl();
    if (!remoteUrl || remoteUrl.includes('anonymous/12345')) {
        console.warn("URL konfigurasi remote adalah placeholder atau tidak valid. Melewatkan pengambilan remote.");
        this.initialized = true;
        return;
    }
    
    // Konfigurasi saat ini adalah default atau versi dari cache.
    // Sekarang kita coba ambil versi terbaru dari jaringan.
    try {
        const response = await fetch(remoteUrl);
        if (!response.ok) {
            throw new Error(`Respons jaringan tidak baik: ${response.statusText}`);
        }
        const remoteData: Partial<RemoteConfig> = await response.json();
        
        // Gabungkan data remote di atas konfigurasi saat ini
        const newConfig = { ...this.config, ...remoteData };
        if(remoteData.feature_flags) newConfig.feature_flags = {...this.config.feature_flags, ...remoteData.feature_flags};
        if(remoteData.tuning_values) newConfig.tuning_values = {...this.config.tuning_values, ...remoteData.tuning_values};

        this.config = newConfig;
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
        console.log("Konfigurasi remote berhasil diambil dan diterapkan.");
    } catch (error) {
        console.warn(`Tidak dapat mengambil konfigurasi remote: ${error}. Menggunakan konfigurasi terakhir yang tersedia (cache atau default).`);
    } finally {
        this.initialized = true;
    }
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