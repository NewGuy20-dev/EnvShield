"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSpinner = startSpinner;
exports.success = success;
exports.error = error;
exports.info = info;
exports.warning = warning;
exports.formatKeyValue = formatKeyValue;
exports.header = header;
exports.table = table;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Create and start a spinner with the given message
 */
function startSpinner(message) {
    return (0, ora_1.default)(message).start();
}
/**
 * Success message with checkmark
 */
function success(message) {
    console.log(chalk_1.default.green('✅ ' + message));
}
/**
 * Error message with X mark
 */
function error(message) {
    console.log(chalk_1.default.red('❌ ' + message));
}
/**
 * Info message with info icon
 */
function info(message) {
    console.log(chalk_1.default.blue('ℹ ' + message));
}
/**
 * Warning message
 */
function warning(message) {
    console.log(chalk_1.default.yellow('⚠ ' + message));
}
/**
 * Format key-value pairs
 */
function formatKeyValue(key, value) {
    console.log(chalk_1.default.cyan(key + ':'), chalk_1.default.white(value));
}
/**
 * Print a section header
 */
function header(title) {
    console.log('');
    console.log(chalk_1.default.bold.white(title));
    console.log(chalk_1.default.gray('─'.repeat(title.length)));
}
/**
 * Print a table
 */
function table(headers, rows) {
    // Calculate column widths
    const colWidths = headers.map((h, i) => {
        const maxRowWidth = Math.max(...rows.map(r => (r[i] || '').length));
        return Math.max(h.length, maxRowWidth);
    });
    // Print header
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
    console.log(chalk_1.default.bold(headerRow));
    console.log(chalk_1.default.gray('─'.repeat(headerRow.length)));
    // Print rows
    rows.forEach(row => {
        const formattedRow = row.map((cell, i) => cell.padEnd(colWidths[i])).join('  ');
        console.log(formattedRow);
    });
}
//# sourceMappingURL=spinner.js.map