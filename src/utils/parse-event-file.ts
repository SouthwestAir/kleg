import fs from 'fs';

import { LoggerHelper } from '../libs';
import { DecodedKafkaEvent, KafkaEvent } from '../models/kafka-event.interface';

export function parseDecodedFile(
  fileName: string
): Partial<DecodedKafkaEvent> | undefined {
  const logger = LoggerHelper.getLogger();
  let event: Partial<DecodedKafkaEvent>;
  try {
    event = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  } catch (error) {
    logger.error(`Unable to read decoded event file`, { fileName });
    throw error;
  }
  if (!Object.entries(event)[0][1])
    throw Error('Kafka message must be provided');

  return event;
}

export function parseEncodedFile(
  fileName: string
): Partial<KafkaEvent> | undefined {
  const logger = LoggerHelper.getLogger();
  let rawEvent: string;
  try {
    rawEvent = fs.readFileSync(fileName, 'utf8');
  } catch (error) {
    logger.error(`Unable to read encoded event file`, { fileName });
    throw error;
  }
  if (rawEvent === '') {
    logger.error(`Encoded event file is empty`);
    throw new Error('Encoded event file is empty');
  }
  const event: Partial<KafkaEvent> = JSON.parse(rawEvent);
  if (!Object.entries(event)[0][1])
    throw Error('Kafka message must be provided');

  return event;
}
