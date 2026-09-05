export class InquiryError extends Error {
  status: number;
}
export function parseInquiryPayload(input: unknown): Record<string, string>;
export function sendInquiryEmail(
  payload: Record<string, string>,
  environment?: NodeJS.ProcessEnv,
): Promise<void>;
