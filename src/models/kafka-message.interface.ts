import { KafkaHeaders, DecodedKafkaHeaders } from './kafka-headers.interface';

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampType: string;
  key?: string;
  value: string;
  headers?: KafkaHeaders[];
}

export interface DecodedKafkaMessage {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampType: string;
  key?: string;
  value: string;
  headers?: DecodedKafkaHeaders[];
}
