import { Logger } from '@aws-lambda-powertools/logger';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { InvokeCommand, LambdaClient, LogType } from '@aws-sdk/client-lambda';

import { LoggerHelper } from './libs';

import {
  GenerateCommandConfig,
  InvokeCommandConfig,
  KafkaMessage,
  KafkaEvent,
  generateCommandRequiredFields,
  invokeCommandRequiredFields,
} from './models';
import {
  getSchemaRegistryClient,
  encodeValue,
  encodeHeaders,
  multiplyArray,
  validateObjectFields,
} from './utils';

/**
 * @public
 */
export class KafkaLambdaEventGenerator {
  static registry?: SchemaRegistry;

  logger: Logger;

  constructor() {
    this.logger = LoggerHelper.getLogger();
  }

  /**
   * Generates a serialized, encoded Kafka message in the format used by
   * lambda event source mappings.
   * @param config - Configuration required for generating events.
   * @returns Encoded KafkaEvent object with all fields provided in input event.
   * @throws Errors if all required fields are not provided or if event cannot be
   * generated.
   */
  public async generate(config: GenerateCommandConfig): Promise<Partial<KafkaEvent>> {
    const missingFields = validateObjectFields(config, generateCommandRequiredFields);

    if (missingFields.length > 0) {
      const errorMsg = `Missing config fields required to generate event`;
      this.logger.error(errorMsg, {
        config,
        missingFields,
      });
      throw new Error(errorMsg);
    }

    if (!KafkaLambdaEventGenerator.registry) {
      KafkaLambdaEventGenerator.registry = await getSchemaRegistryClient(
        config.schemaRegistryHost,
        config.schemaRegistryCredentialsSecret,
        config.schemaRegistryCredentialsSecretRegion
      );
    }

    const records = config.decodedEvent.records;
    const encodedMessages: Partial<KafkaMessage>[] = [];

    for (const rec in records) {
      for (const msg of records[rec]) {
        encodedMessages.push({
          topic: msg.topic,
          partition: msg.partition,
          offset: msg.offset,
          timestamp: msg.timestamp,
          timestampType: msg.timestampType,
          key: msg.key ? Buffer.from(msg.key).toString('base64') : undefined,
          value: msg.value
            ? await encodeValue(KafkaLambdaEventGenerator.registry, msg.value, config)
            : undefined,
          headers: msg.headers ? encodeHeaders(msg.headers) : undefined,
        });
      }
    }

    const encodedEvent: Partial<KafkaEvent> = {
      eventSource: config.decodedEvent.eventSource,
      bootstrapServers: config.decodedEvent.bootstrapServers,
      records: {
        [Object.entries(config.decodedEvent.records)[0][0]]: multiplyArray(
          encodedMessages,
          (config.batchSize as number) ?? 1
        ) as KafkaMessage[],
      },
    };
    return encodedEvent;
  }

  /**
   * Uses a previously-generated Kafka event to invoke a lambda function.
   * @param config - Configuration required for invoking a lambda.
   * @returns Up to 4 KB of lambda invocation logs, if they exist.
   * @throws Errors if all required fields are not provided or if lambda
   * cannot be invoked.
   */
  public async invoke(config: InvokeCommandConfig): Promise<string | undefined> {
    const missingFields = validateObjectFields(config, invokeCommandRequiredFields);

    if (missingFields.length > 0) {
      const errorMsg = `Missing config fields required to invoke lambda`;
      this.logger.error(errorMsg, {
        missingFields,
      });
      throw new Error(errorMsg);
    }

    const lambda = new LambdaClient({ region: config.lambdaRegion });

    const params = {
      FunctionName: config.lambdaName,
      Payload: Buffer.from(JSON.stringify(config.encodedEvent)),
      LogType: LogType.Tail,
    };

    const command = new InvokeCommand(params);

    try {
      this.logger.debug('Attempting to invoke lambda');
      const response = await lambda.send(command);
      this.logger.info('Invoked lambda', config.lambdaName);
      return Buffer.from(response.LogResult!, 'base64').toString();
    } catch (err) {
      console.error('Error invoking lambda', err);
      throw err;
    }
  }
}
