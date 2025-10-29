"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommand = listCommand;
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function listCommand() {
    try {
        (0, config_1.requireAuth)();
        const spinner = (0, spinner_1.startSpinner)('Fetching projects...');
        const api = (0, api_1.createApiClient)();
        try {
            const response = await api.get('/projects');
            spinner.succeed('Projects retrieved');
            const projects = response.data.projects || [];
            if (projects.length === 0) {
                (0, spinner_1.info)('You have no projects yet');
                console.log('Create a project in the web dashboard or ask your team to invite you.');
                return;
            }
            (0, spinner_1.header)(`Your Projects (${projects.length})`);
            const rows = projects.map((p) => [
                p.name,
                p.slug,
                p.role || 'VIEWER',
                (p.environmentsCount || 0).toString(),
                p.description || '(no description)',
            ]);
            (0, spinner_1.table)(['Name', 'Slug', 'Role', 'Environments', 'Description'], rows);
        }
        catch (error) {
            spinner.fail('Failed to fetch projects');
            (0, api_1.handleApiError)(error);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌', error.message);
            process.exit(1);
        }
        throw error;
    }
}
//# sourceMappingURL=list.js.map