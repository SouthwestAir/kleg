import { DecodedKafkaEvent, KafkaEvent } from './kafka-event.interface.js';

export interface AppConfig {
  schemaRegistryHost?: string;
  schemaRegistryCredentialsSecret?: string;
  schemaRegistryCredentialsSecretRegion?: string;
  schemaId?: number;
  decodedEventFile?: string;
  encodedEventFile?: string;
  console?: boolean;
  verbose?: boolean;
  batchSize?: number;
  lambdaName?: string;
  lambdaRegion?: string;
  lambdaLogFile?: string;
}

export interface GenerateCommandConfig {
  /** Input event to serialize and encode */
  decodedEvent: DecodedKafkaEvent;
  /** ID of schema in Confluent Cloud Schema Registry */
  schemaId: number;
  /** URL for Confluent Schema Registry */
  schemaRegistryHost: string;
  /** Name of AWS secret containing Schema Registry credentials */
  schemaRegistryCredentialsSecret: string;
  /** AWS region containing credentials secret */
  schemaRegistryCredentialsSecretRegion: string;
  /** Number of copies of Kafka message(s) to insert into event */
  batchSize?: number;
}
export const generateCommandRequiredFields = [
  'decodedEvent',
  'schemaId',
  'schemaRegistryHost',
  'schemaRegistryCredentialsSecret',
  'schemaRegistryCredentialsSecretRegion',
];

export interface InvokeCommandConfig {
  /** Full event with which to invoke lambda function */
  encodedEvent: KafkaEvent;
  /** Name of lambda function to invoke */
  lambdaName: string;
  /** AWS region containing lambda function to invoke */
  lambdaRegion: string;
}

export const invokeCommandRequiredFields = [
  'encodedEvent',
  'lambdaName',
  'lambdaLogFile',
  'lambdaRegion',
];

export type CliCommand = 'default' | 'generate' | 'invoke';
