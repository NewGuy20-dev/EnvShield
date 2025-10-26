#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .version('1.0.0')
  .description('A secure environment variable manager');

program.parse(process.argv);
