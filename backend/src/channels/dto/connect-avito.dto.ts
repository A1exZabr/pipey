import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectAvitoDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}

export class AvitoWebhookDto {
  type: 'new_message' | 'message_read' | 'message_deleted';
  value?: {
    id: string;
    chat_id: string;
    author_id?: number;
    author_name?: string;
    chat_title?: string;
    direction: 'in' | 'out';
    created: number;
    content?: {
      text?: string;
      images?: Array<{
        url?: string;
        width?: number;
        height?: number;
        sizes?: Array<{
          url: string;
          width: number;
          height: number;
        }>;
      }>;
      link?: {
        url: string;
        title?: string;
      };
    };
  };
}
