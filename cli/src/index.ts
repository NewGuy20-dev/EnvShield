#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .version(packageJson.version)
  .description('A secure environment variable manager');

program.parse();
