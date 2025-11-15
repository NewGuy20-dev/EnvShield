"use strict";
/**
 * Completion command - Generate shell completion scripts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completionCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const bashCompletion = `
# EnvShield completion for bash
_envshield_completions()
{
  local cur prev commands
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  commands="login logout whoami profile list init pull push view search import export completion"
  
  case "\${prev}" in
    envshield)
      COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
      return 0
      ;;
    --format)
      COMPREPLY=( $(compgen -W "dotenv json yaml" -- \${cur}) )
      return 0
      ;;
    --strategy)
      COMPREPLY=( $(compgen -W "overwrite skip merge" -- \${cur}) )
      return 0
      ;;
    *)
      COMPREPLY=( $(compgen -W "--help --version" -- \${cur}) )
      return 0
      ;;
  esac
}

complete -F _envshield_completions envshield
`;
const zshCompletion = `
#compdef envshield

_envshield() {
  local -a commands
  commands=(
    'login:Authenticate with EnvShield'
    'logout:Remove authentication token'
    'whoami:Display current user information'
    'profile:Manage CLI profiles'
    'list:List all projects'
    'init:Initialize EnvShield in current directory'
    'pull:Pull environment variables from remote'
    'push:Push environment variables to remote'
    'view:View environment variables in the terminal'
    'search:Search for variables across projects'
    'import:Import variables from a file'
    'export:Export variables to a file'
    'completion:Generate shell completion scripts'
  )
  
  _describe 'command' commands
}

_envshield "$@"
`;
const fishCompletion = `
# EnvShield completion for fish

complete -c envshield -f
complete -c envshield -n "__fish_use_subcommand" -a "login" -d "Authenticate with EnvShield"
complete -c envshield -n "__fish_use_subcommand" -a "logout" -d "Remove authentication token"
complete -c envshield -n "__fish_use_subcommand" -a "whoami" -d "Display current user information"
complete -c envshield -n "__fish_use_subcommand" -a "profile" -d "Manage CLI profiles"
complete -c envshield -n "__fish_use_subcommand" -a "list" -d "List all projects"
complete -c envshield -n "__fish_use_subcommand" -a "init" -d "Initialize EnvShield in current directory"
complete -c envshield -n "__fish_use_subcommand" -a "pull" -d "Pull environment variables from remote"
complete -c envshield -n "__fish_use_subcommand" -a "push" -d "Push environment variables to remote"
complete -c envshield -n "__fish_use_subcommand" -a "view" -d "View environment variables in the terminal"
complete -c envshield -n "__fish_use_subcommand" -a "search" -d "Search for variables across projects"
complete -c envshield -n "__fish_use_subcommand" -a "import" -d "Import variables from a file"
complete -c envshield -n "__fish_use_subcommand" -a "export" -d "Export variables to a file"
complete -c envshield -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion scripts"

# Options
complete -c envshield -l format -d "File format" -a "dotenv json yaml"
complete -c envshield -l strategy -d "Conflict strategy" -a "overwrite skip merge"
complete -c envshield -l help -d "Display help"
complete -c envshield -l version -d "Display version"
`;
exports.completionCommand = new commander_1.Command('completion')
    .description('Generate shell completion scripts')
    .argument('[shell]', 'Shell type (bash, zsh, fish)', 'bash')
    .action(async (shell) => {
    const normalizedShell = shell.toLowerCase();
    switch (normalizedShell) {
        case 'bash':
            console.log(bashCompletion);
            console.log(chalk_1.default.gray('\n# To install, add to your ~/.bashrc or ~/.bash_profile:'));
            console.log(chalk_1.default.cyan('eval "$(envshield completion bash)"'));
            console.log(chalk_1.default.gray('\n# Or save to a file:'));
            console.log(chalk_1.default.cyan('envshield completion bash > /etc/bash_completion.d/envshield'));
            break;
        case 'zsh':
            console.log(zshCompletion);
            console.log(chalk_1.default.gray('\n# To install, add to your ~/.zshrc:'));
            console.log(chalk_1.default.cyan('eval "$(envshield completion zsh)"'));
            console.log(chalk_1.default.gray('\n# Or save to a file:'));
            console.log(chalk_1.default.cyan('envshield completion zsh > ~/.zsh/completions/_envshield'));
            break;
        case 'fish':
            console.log(fishCompletion);
            console.log(chalk_1.default.gray('\n# To install, save to:'));
            console.log(chalk_1.default.cyan('envshield completion fish > ~/.config/fish/completions/envshield.fish'));
            break;
        default:
            console.error(chalk_1.default.red(`✖ Unsupported shell: ${shell}`));
            console.log(chalk_1.default.gray('Supported shells: bash, zsh, fish'));
            process.exit(1);
    }
});
//# sourceMappingURL=completion.js.map