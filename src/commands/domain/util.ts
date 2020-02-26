import { CustomDomain, DNSRecord } from "../../container/types";
import { displayDate } from "../../util";

export const tableIndentationPadding = 4;

export function getDomainTableHeader(): string[] {
  return [
    "DOMAIN",
    "VERIFIED",
    "CONNECTED",
    "CUSTOM_CERT",
    "REDIRECT",
    "SSL_CERT_EXPIRY",
    "CREATED_AT",
  ];
}

export function getDomainTableRow(customDomain: CustomDomain): string[] {
  return [
    customDomain.domain,
    customDomain.verified ? "true" : "false",
    customDomain.connected ? "true" : "false",
    customDomain.tls_secret_id ? "true" : "false",
    customDomain.redirect_domain || "-",
    customDomain.tls_secret_expiry
      ? displayDate(customDomain.tls_secret_expiry)
      : "-",
    displayDate(customDomain.created_at),
  ];
}

export function getDNSRecordTableHeader(): string[] {
  return ["TYPE", "HOST", "VALUE"];
}

export function getDNSRecordTableRow(dnsRecord: DNSRecord): string[] {
  return [dnsRecord.type, dnsRecord.host, dnsRecord.value];
}
