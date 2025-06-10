export type ConversationsFile = Conversation[];

export interface Conversation {
    id: string;
    title: string;
    create_time: number;
    update_time: number;
    mapping: Record<string, MessageNode>;
    current_node: string;
}

export interface MessageNode {
    id: string;
    message: Message | null;
    parent: string | null;
    children: string[];
}

export interface Message {
    id: string;
    author: {
        role: "user" | "assistant" | "system";
        name?: string;
        metadata?: Record<string, unknown>;
    };
    create_time: number;
    content: MessageContent;
    metadata?: {
        attachments: {
            id: string;
            name: string;
        }[]
    }
}

export interface MessageContent {
    content_type: "text" | "code" | "tether_browsing_display" | "tether_quote" | "image_asset_pointer" | "multimodal_text" | "thoughts" | "execution_output" | "reasoning_recap" | string;
    parts?: any[];
    result?: string;
    asset_pointer?: string;
    metadata?: {
        dalle: any
    }
}
