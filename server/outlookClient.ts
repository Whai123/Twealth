import { Client } from '@microsoft/microsoft-graph-client';

interface OutlookConnectionSettings {
  settings: {
    access_token?: string;
    expires_at?: string;
    oauth?: {
      credentials?: {
        access_token?: string;
      };
    };
  };
}

let connectionSettings: OutlookConnectionSettings | null = null;

async function getAccessToken(): Promise<string | null> {
  try {
    // Return cached token if still valid
    if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
      const cachedToken = connectionSettings.settings.access_token;
      if (cachedToken) {
        return cachedToken;
      }
    }
    
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) {
      throw new Error('REPLIT_CONNECTORS_HOSTNAME environment variable is not set');
    }
    
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('Authentication token not found. REPL_IDENTITY or WEB_REPL_RENEWAL must be set');
    }

    const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=outlook`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Outlook connection: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    connectionSettings = data.items?.[0];

    // Return null if Outlook is not connected (expected state, not an error)
    if (!connectionSettings) {
      console.log('[OutlookClient] Outlook connection not found - user has not connected their account');
      return null;
    }

    const accessToken = connectionSettings.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!accessToken) {
      console.warn('[OutlookClient] Outlook access token not found in connection settings');
      return null;
    }
    
    return accessToken;
  } catch (error) {
    // Log error details for debugging with full stack trace
    console.error('[OutlookClient] Error getting access token:', error);
    
    // Re-throw original error to preserve stack trace
    throw error;
  }
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
// Returns null if Outlook is not connected (expected state).
export async function getUncachableOutlookClient() {
  try {
    const accessToken = await getAccessToken();
    
    // Return null if user hasn't connected Outlook (not an error)
    if (!accessToken) {
      return null;
    }

    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => accessToken
      }
    });
  } catch (error) {
    console.error('[OutlookClient] Error creating Outlook client:', error);
    throw error; // Re-throw to preserve stack trace
  }
}
