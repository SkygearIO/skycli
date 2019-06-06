export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
}

// tslint:disable-next-line:no-any
export function logEntryFromJSON(input: any): LogEntry {
  return {
    level: input.level,
    message: input.message,
    timestamp: input.timestamp && new Date(input.timestamp)
  };
}
