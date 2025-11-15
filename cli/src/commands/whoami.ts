import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth, getActiveProfile } from '../utils/config';
import { startSpinner, header, formatKeyValue } from '../utils/spinner';

export async function whoamiCommand() {
  try {
    const config = requireAuth();
    const activeProfile = getActiveProfile();
    
    const spinner = startSpinner('Fetching user info...');
    const api = createApiClient();

    try {
      const response = await api.get('/cli/whoami');
      spinner.succeed('User info retrieved');

      const { user, token } = response.data;

      header('User Information');
      formatKeyValue('Email', user.email);
      formatKeyValue('Name', user.name || '(not set)');
      formatKeyValue('ID', user.id);

      if (token) {
        console.log('');
        header('Token Information');
        formatKeyValue('Profile', activeProfile || 'default');
        formatKeyValue('Token Name', config.tokenName || token.name || '(not set)');
        formatKeyValue('Token ID', token.id);
        if (config.expiresAt) {
          const expiresDate = new Date(config.expiresAt);
          const daysUntilExpiry = Math.floor((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          formatKeyValue('Expires', `${expiresDate.toLocaleDateString()} (${daysUntilExpiry} days)`);
        }
        if (token.lastUsedAt) {
          formatKeyValue('Last Used', new Date(token.lastUsedAt).toLocaleString());
        }
        formatKeyValue('API URL', config.apiUrl);
      }
    } catch (error) {
      spinner.fail('Failed to fetch user info');
      handleApiError(error);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌', error.message);
      process.exit(1);
    }
    throw error;
  }
}
