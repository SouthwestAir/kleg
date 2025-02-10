import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

import { LoggerHelper } from '../libs';
import { FetchSecret } from '../libs/fetch-secret';

export async function getSchemaRegistryClient(
  host: string,
  secretName: string,
  secretRegion?: string
): Promise<SchemaRegistry> {
  const logger = LoggerHelper.getLogger();
  const smClient = new SecretsManager({ region: secretRegion });
  const fetchSecret = new FetchSecret(smClient);

  let schemaRegistryCreds;
  try {
    schemaRegistryCreds = await fetchSecret.fetchSecret(secretName);
    schemaRegistryCreds = JSON.parse(schemaRegistryCreds!);
  } catch (error) {
    logger.error(
      `Error fetching schema registry credentials for host ${host}. Are ` +
        `you signed into the AWS CLI with the correct account?`
    );
    throw error;
  }

  return new SchemaRegistry({
    host: host,
    auth: {
      username: schemaRegistryCreds.username,
      password: schemaRegistryCreds.password,
    },
  });
}
