import fs from 'fs';

import { LoggerHelper } from '../libs';

export function writeFile(fileName: string, content: string): void {
  const logger = LoggerHelper.getLogger();
  logger.debug('Attempting to write content to file', { fileName });
  fs.writeFileSync(fileName, content, {
    flag: 'w',
  });
}
