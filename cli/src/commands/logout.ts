import { clearConfig, isLoggedIn } from '../utils/config';
import { success, info } from '../utils/spinner';

export async function logoutCommand() {
  if (!isLoggedIn()) {
    info('You are not logged in');
    return;
  }

  try {
    clearConfig();
    success('Logged out successfully');
    console.log('Token removed from ~/.envshield/config.json');
  } catch (error) {
    console.error('Failed to logout:', error);
    process.exit(1);
  }
}
