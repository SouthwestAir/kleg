#!/usr/bin/env node

import { Command } from 'commander';

import { LoggerHelper } from './libs';

// Changing this to an ES6 import causes the package.json to be double-bundled in the build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json');

import {
  coalesceObjects,
  parseConfigCliArgs,
  parseConfigFile,
  parseDecodedFile,
  parseEncodedFile,
  writeFile,
} from './utils';
import { KafkaLambdaEventGenerator } from '.';
import {
  AppConfig,
  DecodedKafkaEvent,
  GenerateCommandConfig,
  InvokeCommandConfig,
  KafkaEvent,
  CliCommand,
} from './models';

process.env = {
  ...process.env,
  POWERTOOLS_DEV: 'true',
  LOG_LEVEL: 'WARN',
};

const logger = LoggerHelper.createLogger('kleg');

const DEFAULTS = {
  CONFIG_FILE: 'config.yml',
};

const COMMANDS = {
  DEFAULT: 'default',
  GENERATE: 'generate',
  INVOKE: 'invoke',
};

const program = new Command();

program.version(pkg.version).description(pkg.description);

// Define CLI options
program
  .option('-f, --config-file <value>', 'Path to config file', DEFAULTS.CONFIG_FILE)
  .option('-c, --console', 'Write output to console')
  .option('-v, --verbose', 'Enable debug logs')
  .option('-d, --decoded-event-file <value>', 'Path to input file with decoded event')
  .option('-e, --encoded-event-file <value>', 'Path of file to which to write encoded event')
  .option('-l, --lambda-log-file <value>', 'Name of lambda log output file')
  .option('-b, --batch-size <value>', 'Number of copies of Kafka message(s) to insert into event')
  .parse(process.argv);

// Default command
program.action(() => {
  main(COMMANDS.DEFAULT as CliCommand);
});

// Generate command
program
  .command(COMMANDS.GENERATE)
  .description('Only generate event, do not send to lambda')
  .action(() => {
    main(COMMANDS.GENERATE as CliCommand);
  });

// Invoke command
program
  .command(COMMANDS.INVOKE)
  .description('Invoke lambda using previously generated event')
  .action(() => {
    main(COMMANDS.INVOKE as CliCommand);
  });

program.parse(process.argv);

async function main(command: CliCommand) {
  const args = program.opts();
  const cliConfig = parseConfigCliArgs(args);
  const fileConfig = parseConfigFile(args.configFile, DEFAULTS.CONFIG_FILE);
  const appConfig: Partial<AppConfig> = coalesceObjects(
    cliConfig as AppConfig,
    fileConfig as AppConfig
  );

  if (appConfig.verbose) {
    logger.setLogLevel('DEBUG');
  }

  logger.info('Retrieved config from CLI and config file', appConfig);

  const commandConfig: Partial<GenerateCommandConfig & InvokeCommandConfig> = appConfig;

  // Parse input file with decoded event, if provided and command is not 'invoke'
  if (appConfig.decodedEventFile && command !== COMMANDS.INVOKE) {
    commandConfig.decodedEvent = parseDecodedFile(appConfig.decodedEventFile) as DecodedKafkaEvent;
  }

  // Parse input file with encoded event, if provided and command is 'invoke'
  if (appConfig.encodedEventFile && command === COMMANDS.INVOKE) {
    commandConfig.encodedEvent = parseEncodedFile(appConfig.encodedEventFile) as KafkaEvent;
  }

  const kleg = new KafkaLambdaEventGenerator();

  switch (command) {
    case COMMANDS.DEFAULT:
      commandConfig.encodedEvent = await handleGenerateCommand(
        kleg,
        appConfig,
        commandConfig as GenerateCommandConfig
      );
      handleInvokeCommand(kleg, appConfig, commandConfig as InvokeCommandConfig);
      break;

    case COMMANDS.GENERATE:
      handleGenerateCommand(kleg, appConfig, commandConfig as GenerateCommandConfig);
      break;

    case COMMANDS.INVOKE:
      handleInvokeCommand(kleg, appConfig, commandConfig as InvokeCommandConfig);
      break;

    default:
      logger.error('Unknown command');
  }
}

async function handleGenerateCommand(
  kleg: KafkaLambdaEventGenerator,
  appConfig: AppConfig,
  commandConfig: GenerateCommandConfig
): Promise<KafkaEvent> {
  logger.debug('Calling Generate command', { commandConfig });
  const encodedEvent = await kleg.generate(commandConfig as GenerateCommandConfig);
  const strEvent = JSON.stringify(encodedEvent);

  if (appConfig.console) {
    console.log('GENERATED EVENT:');
    console.log(strEvent);
    console.log();
  }

  if (appConfig.encodedEventFile) {
    writeFile(appConfig.encodedEventFile, strEvent);
    console.log(`Wrote output event to ${appConfig.encodedEventFile}`);
  }

  console.log('✅ Generated event');
  return encodedEvent as KafkaEvent;
}

async function handleInvokeCommand(
  kleg: KafkaLambdaEventGenerator,
  appConfig: AppConfig,
  commandConfig: InvokeCommandConfig
) {
  logger.debug('Calling Invoke command', { commandConfig });
  const logs = await kleg.invoke(commandConfig as InvokeCommandConfig);

  if (logs) {
    if (appConfig.console) {
      console.log('LAMBDA LOGS (last 4 KB):');
      console.log(logs);
      console.log();
    }

    if (appConfig.lambdaLogFile) {
      writeFile(appConfig.lambdaLogFile, logs);
      console.log(`Wrote last 4 KB of logs to ${appConfig.lambdaLogFile}`);
    }
  } else {
    logger.warn('Unable to obtain lambda logs');
  }
  console.log('✅ Invoked lambda');
}
