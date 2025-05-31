import { DecodedKafkaMessage, KafkaMessage } from './kafka-message.interface.js';

export interface KafkaEvent {
  eventSource: string;
  bootstrapServers: string;
  records: Record<string, KafkaMessage[]>;
}

export interface DecodedKafkaEvent {
  eventSource: string;
  bootstrapServers: string;
  records: Record<string, DecodedKafkaMessage[]>;
}
