import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import { LoggerHelper } from '../libs';
import { AppConfig } from '../models/app-config.interface';

export function parseConfigFile(
  configFilePath: string,
  defaultPath: string
): Partial<AppConfig> {
  const logger = LoggerHelper.getLogger();
  let file: string | undefined;
  let error: Error | undefined;

  try {
    file = fs.readFileSync(configFilePath, 'utf8');
  } catch (e) {
    error = e as Error;
  }

  if (file === undefined) {
    try {
      file = fs.readFileSync(
        path.join(`.`, `kleg`, `${configFilePath}`),
        'utf8'
      );
    } catch {
      null;
    }
  }

  if (file === undefined) {
    if (configFilePath === defaultPath) {
      logger.error(
        `Unable to read config file at default location ${defaultPath}. ` +
          `Create a valid config file in this location or specify a ` +
          `different path using -f <file path>.`
      );
    } else {
      logger.error(`Unable to read config file at ${configFilePath}`);
    }
    throw error;
  }

  const fileConfig = YAML.parse(file);

  return {
    schemaRegistryHost: fileConfig.SchemaRegistry.Host,
    schemaRegistryCredentialsSecret:
      fileConfig.SchemaRegistry.CredentialsSecret,
    schemaRegistryCredentialsSecretRegion:
      fileConfig.SchemaRegistry.CredentialsSecretRegion,
    schemaId: fileConfig.SchemaRegistry.SchemaId,
    decodedEventFile: fileConfig.DecodedEventFile,
    encodedEventFile: fileConfig.EncodedEventFile,
    console: fileConfig.Console,
    verbose: fileConfig.Verbose,
    batchSize: fileConfig.BatchSize,
    lambdaName: fileConfig.Lambda?.Name,
    lambdaRegion: fileConfig.Lambda?.Region,
    lambdaLogFile: fileConfig.Lambda?.LogFile,
  };
}
