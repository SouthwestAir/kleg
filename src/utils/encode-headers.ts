import { DecodedKafkaHeaders, KafkaHeaders } from '../models/index.js';

export function encodeHeaders(headers: DecodedKafkaHeaders[]): KafkaHeaders[] {
  return headers.map((header) => {
    const encodedHeader: KafkaHeaders = {};

    for (const key in header) {
      if (Object.prototype.hasOwnProperty.call(header, key)) {
        const value = header[key].toString();
        const encodedValue: number[] = [];

        for (let i = 0; i < value.length; i++) {
          encodedValue.push(value.charCodeAt(i));
        }

        encodedHeader[key] = encodedValue;
      }
    }

    return encodedHeader;
  });
}
