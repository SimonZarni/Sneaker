export const MESSAGE_TYPE = {
    Text:     'text',
    OrderRef: 'order_ref',
    Image:    'image',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
