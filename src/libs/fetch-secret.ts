import { SecretsManager, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Logger } from '@aws-lambda-powertools/logger';

import { LoggerHelper } from '.';

/**
 * Helper class for retrieving secret values from AWS SecretsManager.
 * @public
 */
export class FetchSecret {
  smClient: SecretsManager;
  logger: Logger;
  constructor(smClient: SecretsManager) {
    this.smClient = smClient;
    this.logger = LoggerHelper.getLogger();
  }
  /**
   * Retrieves a string secret value from SecretsManager. Does not parse
   * or transform value at all, even if value is JSON. Use `JSON.parse()`
   * if needed to parse value.
   * @param secretName - Name of the secret to retrieve.
   * @returns String containing raw SecretString property value from
   * GetSecretValueCommandOutput.
   * @throws Any errors raised by underlying AWS client's
   * GetSecretValueCommand.
   */
  async fetchSecret(secretName: string) {
    try {
      this.logger.debug(`Attempting to fetch secret from Secrets Manager`, {
        secretName,
      });
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.smClient.send(command);
      this.logger.info(`Successfully fetched secret`, { secretName });
      return response.SecretString;
    } catch (error) {
      this.logger.error(`An error occurred while fetching secret`, {
        secretName,
        error,
      });
      throw error;
    }
  }
}
