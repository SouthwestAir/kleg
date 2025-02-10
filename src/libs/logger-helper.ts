import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Singleton wrapper class for AWS Lambda Powertools Logger.
 */
export class LoggerHelper {
  static logger: Logger;

  /**
   * Creates a new Logger instance. Intended to be called upon system
   * initialization, such as outside the handler of a Lambda function.
   * @param serviceName - Name of the service to insert into logs.
   * @returns A newly created Logger object.
   */
  static createLogger(serviceName: string) {
    LoggerHelper.logger = new Logger({
      serviceName: serviceName,
    });

    return LoggerHelper.logger;
  }

  /**
   * Checks whether a Logger object already exists and returns if so.
   * If not, a new Logger will be created with `serviceName` set to
   * `local_test`. Call `createLogger` prior to calling this method
   * to correctly initialize `serviceName`.
   * @returns A Logger object.
   */
  static getLogger(): Logger {
    return LoggerHelper.logger ?? LoggerHelper.createLogger('local_test');
  }
}
