import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { startSpinner, header, table, info } from '../utils/spinner';

export async function listCommand() {
  try {
    requireAuth();
    
    const spinner = startSpinner('Fetching projects...');
    const api = createApiClient();

    try {
      const response = await api.get('/projects');
      spinner.succeed('Projects retrieved');

      const projects = response.data.projects || [];

      if (projects.length === 0) {
        info('You have no projects yet');
        console.log('Create a project in the web dashboard or ask your team to invite you.');
        return;
      }

      header(`Your Projects (${projects.length})`);
      
      const rows = projects.map((p: any) => [
        p.name,
        p.slug,
        p.role || 'VIEWER',
        (p.environmentsCount || 0).toString(),
        p.description || '(no description)',
      ]);

      table(
        ['Name', 'Slug', 'Role', 'Environments', 'Description'],
        rows
      );
    } catch (error) {
      spinner.fail('Failed to fetch projects');
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
