#!/usr/bin/env node
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };

const program = new Command();

program
  .version(packageJson.version)
  .description('A secure environment variable manager');

program.parse();
