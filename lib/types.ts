// Mirrors the Pydantic schemas in doc_flow_backend/app/service/*/schema.py

export type ProcessingType =
  | "DOCUMENT_SUMMARY"
  | "INVOICE_EXTRACTION"
  | "CONTRACT_METADATA";

export type ProcessingStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type DocumentStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface DocFlowDocument {
  id: number;
  name: string;
  status: DocumentStatus;
  file_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Paginated {
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface PaginatedDocuments extends Paginated {
  documents: DocFlowDocument[];
}

export interface DocFlowFile {
  id: number;
  name: string;
  content_type: string;
  extension: string;
  created_at: string;
}

export interface PaginatedFiles extends Paginated {
  files: DocFlowFile[];
}

export interface DocumentProcessingResponse {
  document_id: number;
  processing_request_id: number;
  status: ProcessingStatus;
}

export interface ProcessingStatusResponse {
  id: number;
  status: ProcessingStatus;
}

export interface ProcessingRequest {
  id: number;
  document_id: number;
  processing_type: ProcessingType;
  instructions: string | null;
  status: ProcessingStatus;
  version: number;
  created_at: string;
  updated_at: string | null;
}

export interface ProcessingJob {
  attempt: number;
  status: string;
  created_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
}

export interface InvoiceExtraction {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  vendor_name: string | null;
  customer_name: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  line_items: InvoiceLineItem[];
}

export interface ContractMetadata {
  contract_type: string | null;
  title: string | null;
  parties: string[];
  effective_date: string | null;
  expiration_date: string | null;
  governing_law: string | null;
  renewal_terms: string | null;
  termination_terms: string | null;
  key_obligations: string[];
}

export interface ProcessingResult {
  result: string | InvoiceExtraction | ContractMetadata;
  confidence_score: number | null;
}

export interface RecentFailure {
  processing_request_id: number;
  document_id: number;
  document_name: string;
  processing_type: ProcessingType;
  failure_reason: string | null;
  failed_at: string | null;
}

export interface UserStats {
  documents: { total: number; active: number; archived: number };
  processing_requests: {
    total: number;
    by_status: Partial<Record<ProcessingStatus, number>>;
    by_type: Partial<Record<ProcessingType, number>>;
  };
  recent_failures: RecentFailure[];
}

// ---- Chat ----

export type ChatModel = "auto" | "openrouter" | "gemini" | "groq" | "openai";

export interface ModelOption {
  id: string;
  label: string;
  model: string | null;
}

export interface ModelsResponse {
  default: string;
  models: ModelOption[];
}

export interface Conversation {
  id: number;
  title: string;
  document_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedConversations extends Paginated {
  conversations: Conversation[];
}

export interface Citation {
  page: number;
  quote: string;
}

export type ChatMessageStatus = "complete" | "cancelled" | "error";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  status: ChatMessageStatus;
  model: string | null;
  citations?: Citation[] | null;
  grounded?: boolean | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface StreamChatRequest {
  message: string;
  model?: ChatModel | null;
  conversation_id?: number | null;
}

/** Server-Sent Events from POST /chat/stream, in order: conversation, token*, done | error. */
export type ChatStreamEvent =
  | { event: "conversation"; data: { conversation_id: number } }
  | { event: "token"; data: { text: string } }
  | {
      event: "done";
      data: {
        provider: string;
        model: string;
        input_tokens: number | null;
        output_tokens: number | null;
        latency_ms: number | null;
        first_piece_ms: number | null;
      };
    }
  | { event: "error"; data: { code: number | string; message: string } };
