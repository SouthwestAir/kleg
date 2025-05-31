import { AppConfig } from '../models/app-config.interface.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseConfigCliArgs(args: any): Partial<AppConfig> {
  return {
    console: args.console,
    verbose: args.verbose,
    decodedEventFile: args.decodedEventFile,
    encodedEventFile: args.encodedEventFile,
    lambdaLogFile: args.lambdaLogFile,
    batchSize: args.batchSize,
  };
}
