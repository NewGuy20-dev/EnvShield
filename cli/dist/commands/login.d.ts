import { Command } from 'commander';
interface LoginOptions {
    token?: string;
    profile?: string;
    apiUrl?: string;
}
export declare function loginCommand(options?: LoginOptions): Promise<void>;
export declare function registerLoginCommand(program: Command): void;
export {};
//# sourceMappingURL=login.d.ts.map