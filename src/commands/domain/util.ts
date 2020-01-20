import { DNSRecord } from "../../container/types";

export function getDNSRecordTableHeader(): string[] {
  return ["TYPE", "HOST", "VALUE"];
}

export function getDNSRecordTableRow(dnsRecord: DNSRecord): string[] {
  return [dnsRecord.type, dnsRecord.host, dnsRecord.value];
}
