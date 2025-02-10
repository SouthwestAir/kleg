import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

import { LoggerHelper } from '../libs';

import { GenerateCommandConfig } from '../models';

export async function encodeValue(
  registry: SchemaRegistry,
  value: string,
  config: GenerateCommandConfig
): Promise<string> {
  const logger = LoggerHelper.getLogger();

  try {
    const serializedValue = await registry.encode(config.schemaId, value);
    return serializedValue.toString('base64');
  } catch (error) {
    logger.error(
      'Failed to serialize message. Are you sure the ' +
        'input message matches the Avro schema?',
      error as Error
    );
    throw error;
  }
}
