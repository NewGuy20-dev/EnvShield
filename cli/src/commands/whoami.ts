import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { startSpinner, header, formatKeyValue } from '../utils/spinner';

export async function whoamiCommand() {
  try {
    requireAuth();
    
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
        formatKeyValue('Name', token.name || '(not set)');
        formatKeyValue('ID', token.id);
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
