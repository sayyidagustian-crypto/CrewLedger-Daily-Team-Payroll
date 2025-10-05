// FIX: Added a global declaration for `window.google` and `window.gapi` to resolve TypeScript errors.
// The Google Identity and GAPI libraries add these objects to the window, and this change makes TypeScript aware of their existence.
declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

// This service encapsulates all interactions with the Google Drive API.

// --- CONFIGURATION ---
// IMPORTANT: These values must be replaced with your own from Google Cloud Console.
// For security, these should be stored in environment variables and not hard-coded.
const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY || '' : '';
const CLIENT_ID = (typeof process !== 'undefined' && process.env) ? process.env.GOOGLE_CLIENT_ID || '' : '';

// The scope determines what permissions the app asks for.
// 'drive.file' is the most restrictive scope that allows the app to create,
// read, and modify only the files it creates itself. It cannot see other user files.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const BACKUP_FILE_NAME = 'crewledger_backup.json';

export interface DriveUserInfo {
    name: string;
    email: string;
    picture: string;
}

class GoogleDriveService {
    private tokenClient: any = null;

    /**
     * Dynamically loads the Google API script.
     */
    public loadGapiScript(callback: () => void) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => window.gapi.load('client', callback);
        document.body.appendChild(script);
    }
    
    /**
     * Initializes the Google API client. Must be called after the gapi script is loaded.
     */
    public async initClient(callback: () => void) {
        try {
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
             this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '', // Callback is handled by the promise wrapper in signIn
            });
            callback();
        } catch (error) {
            console.error("Error initializing Google API client", error);
        }
    }

    /**
     * Signs the user in.
     */
    public signIn(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                return reject("Token client not initialized.");
            }
            
            this.tokenClient.callback = (resp: any) => {
                if (resp.error) {
                    return reject(resp.error);
                }
                resolve();
            };
            
            if (window.gapi.client.getToken() === null) {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                 this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    /**
     * Signs the user out.
     */
    public signOut() {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {});
            window.gapi.client.setToken(null);
        }
    }
    
    public getToken() {
        return window.gapi.client.getToken();
    }

    public async getUserInfo(): Promise<DriveUserInfo | null> {
        try {
            const res = await window.gapi.client.request({
                'path': 'https://www.googleapis.com/oauth2/v3/userinfo'
            });
            return {
                name: res.result.name,
                email: res.result.email,
                picture: res.result.picture,
            };
        } catch (error) {
            console.error("Error fetching user info", error);
            return null;
        }
    }

    /**
     * Finds the backup file in the user's Drive.
     * @returns The file ID if found, otherwise null.
     */
    private async findBackupFile(): Promise<string | null> {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
            });
            if (response.result.files && response.result.files.length > 0) {
                return response.result.files[0].id;
            }
            return null;
        } catch (error) {
            console.error("Error finding backup file", error);
            return null;
        }
    }

    /**
     * Uploads the application data as a JSON file to Google Drive.
     * It will overwrite the existing backup file if it exists, or create a new one.
     */
    public async uploadBackup(data: object): Promise<any> {
        const fileId = await this.findBackupFile();
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        
        const metadata = {
            'name': BACKUP_FILE_NAME,
            'mimeType': 'application/json',
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', blob);

        let path = '/upload/drive/v3/files';
        let method = 'POST';

        if (fileId) {
            path = `/upload/drive/v3/files/${fileId}`;
            method = 'PATCH';
        }
        
        try {
            const response = await window.gapi.client.request({
                path: path,
                method: method,
                params: { uploadType: 'multipart' },
                body: formData,
            });
            return response.result;
        } catch (error) {
            console.error("Error uploading backup", error);
            throw error;
        }
    }

    /**
     * Downloads the backup file from Google Drive and returns its content.
     */
    public async downloadBackup(): Promise<any | null> {
        const fileId = await this.findBackupFile();
        if (!fileId) {
            return null; // No backup found
        }
        
        try {
            const response = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            return response.result;
        } catch (error) {
            console.error("Error downloading backup", error);
            throw error;
        }
    }
}

export const googleDriveService = new GoogleDriveService();