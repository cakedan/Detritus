import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, WebhookTypes } from '../constants';
import { addQuery, getFormatFromHash, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { User } from './user';


const keysWebhook = new BaseSet<string>([
  DiscordKeys.AVATAR,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DISCRIMINATOR,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.TOKEN,
  DiscordKeys.USER,
]);

/**
 * Webhook Structure
 * @category Structure
 */
export class Webhook extends BaseStructure {
  readonly _keys = keysWebhook;

  avatar: null | string = null;
  channelId: string = '';
  discriminator: string = '0000';
  guildId: string = '';
  id: string = '';
  name: string = '';
  token?: null | string;
  type: WebhookTypes = WebhookTypes.INCOMING;
  user?: null | User;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get avatarUrl(): string {
    return this.avatarUrlFormat();
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get defaultAvatarUrl(): string {
    return Endpoints.CDN.URL + Endpoints.CDN.AVATAR_DEFAULT(parseInt(this.discriminator) % 5);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.USER(this.id);
  }

  get mention(): string {
    return `<@${this.id}>`;
  }

  avatarUrlFormat(format?: string, query?: UrlQuery): string {
    if (!this.avatar) {
      return addQuery(
        this.defaultAvatarUrl,
        query,
      );
    }
    const hash = this.avatar;
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.AVATAR(this.id, hash, format),
      query,
    );
  }

  async createMessage(
    options: RequestTypes.ExecuteWebhook,
    compatibleType?: string,
  ) {
    return this.execute(options, compatibleType);
  }

  async delete(options: RequestTypes.DeleteWebhook = {}) {
    if (this.token) {
      return this.client.rest.deleteWebhookToken(this.id, this.token, options);
    }
    return this.client.rest.deleteWebhook(this.id, options);
  }

  async deleteMessage(messageId: string) {
    if (!this.token) {
      throw new Error('Webhook is missing it\'s token');
    }
    return this.client.rest.deleteWebhookTokenMessage(this.id, this.token, messageId);
  }

  async edit(options: RequestTypes.EditWebhook = {}) {
    if (this.token) {
      return this.client.rest.editWebhookToken(this.id, this.token, options);
    }
    return this.client.rest.editWebhook(this.id, options);
  }

  async editMessage(messageId: string, options: RequestTypes.EditWebhookTokenMessage = {}) {
    if (!this.token) {
      throw new Error('Webhook is missing it\'s token');
    }
    return this.client.rest.editWebhookTokenMessage(this.id, this.token, messageId, options);
  }

  async execute(
    options: RequestTypes.ExecuteWebhook,
    compatibleType?: string,
  ) {
    if (!this.token) {
      throw new Error('Webhook is missing it\'s token');
    }
    return this.client.rest.executeWebhook(this.id, this.token, options, compatibleType);
  }


  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.USER: {
          let user: User;
          if (this.isClone) {
            user = new User(this.client, value, this.isClone);
          } else {
            if (this.client.users.has(value.id)) {
              user = this.client.users.get(value.id) as User;
              user.merge(value);
            } else {
              user = new User(this.client, value);
              this.client.users.insert(user);
            }
          }
          value = user;
        }; break;
      }
      super.mergeValue(key, value);
    }
  }

  toString(): string {
    return `${this.name}#${this.discriminator}`;
  }
}
