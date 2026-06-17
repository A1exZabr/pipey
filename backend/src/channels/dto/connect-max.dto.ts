import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectMaxDto {
  @IsString()
  @IsNotEmpty()
  botToken: string;
}

export class MaxWebhookDto {
  update_type: 'message_created' | 'message_callback' | 'message_edited';
  timestamp: number;
  message?: {
    message_id?: string;
    msg_id?: string;
    timestamp: number;
    text?: string;
    body?: string;
    sender?: {
      user_id: string;
      first_name?: string;
      last_name?: string;
      name?: string;
      username?: string;
      nick?: string;
    };
    from?: {
      user_id: string;
      first_name?: string;
      last_name?: string;
      name?: string;
      username?: string;
      nick?: string;
    };
    chat?: {
      id: string;
      type: string;
      title?: string;
    };
    recipient?: {
      chat_id: string;
      user_id?: string;
    };
    parts?: Array<{
      type: 'file' | 'sticker' | 'voice' | 'mention' | 'forward';
      payload?: {
        file_id?: string;
        name?: string;
        mime_type?: string;
        size?: number;
        type?: string;
        duration?: number;
      };
    }>;
  };
  callback?: {
    callback_id: string;
    user: {
      user_id: string;
      name?: string;
    };
    payload?: string;
  };
}
