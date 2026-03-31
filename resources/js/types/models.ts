import { MessageType } from './enums';

export interface ChatMessagePayload {
    version:      number;
    type:         MessageType;
    text:         string;
    order_id?:    number;
    order_status?: string;
}

export interface ChatMessage {
    id:           number;
    sender_type:  'user' | 'admin';
    /** Decrypted text — always resolved server-side before sending to the client */
    text:         string;
    message_type: MessageType;
    edited_at:    string | null;
    created_at:   string;
}
