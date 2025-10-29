"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutCommand = logoutCommand;
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function logoutCommand() {
    if (!(0, config_1.isLoggedIn)()) {
        (0, spinner_1.info)('You are not logged in');
        return;
    }
    try {
        (0, config_1.clearConfig)();
        (0, spinner_1.success)('Logged out successfully');
        console.log('Token removed from ~/.envshield/config.json');
    }
    catch (error) {
        console.error('Failed to logout:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=logout.js.map