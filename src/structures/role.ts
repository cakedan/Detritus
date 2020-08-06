import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Permissions } from '../constants';
import { PermissionTools, Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { ChannelGuildBase } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Overwrite } from './overwrite';


const keysRole = new BaseSet<string>([
  DiscordKeys.COLOR,
  DiscordKeys.GUILD_ID,
  DiscordKeys.HOIST,
  DiscordKeys.ID,
  DiscordKeys.MANAGED,
  DiscordKeys.MENTIONABLE,
  DiscordKeys.NAME,
  DiscordKeys.PERMISSIONS,
  DiscordKeys.PERMISSIONS_NEW,
  DiscordKeys.POSITION,
  DiscordKeys.TAGS,
]);

const keysMergeRole = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.TAGS,
]);

/**
 * Guild Role Structure, used in [Guild]
 * @category Structure
 */
export class Role extends BaseStructure {
  readonly _keys = keysRole;
  readonly _keysMerge = keysMergeRole;

  color: number = 0;
  guildId: string = '';
  hoist: boolean = false;
  id: string = '';
  managed: boolean = false;
  mentionable: boolean = false;
  name: string = '';
  permissions: number = 0;
  permissionsNew: bigint = 0n;
  position: number = 0;
  tags: {
    bot?: string,
    integration?: string,
    premium_subscriber?: null,
  } | null = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get botId(): null | string {
    if (this.tags && this.tags.bot) {
      return this.tags.bot;
    }
    return null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get integrationId(): null | string {
    if (this.tags && this.tags.integration) {
      return this.tags.integration;
    }
    return null;
  }

  get isBoosterRole(): boolean {
    if (this.tags) {
      return 'premium_subscriber' in this.tags;
    }
    return false;
  }

  get isDefault(): boolean {
    return this.id === this.guildId;
  }

  get members(): BaseCollection<string, Member> {
    const guild = this.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      if (this.isDefault) {
        return members;
      }
      const collection = new BaseCollection<string, Member>();
      for (let [userId, member] of members) {
        if (member._roles && member._roles.includes(this.id)) {
          collection.set(userId, member);
        }
      }
      return collection;
    }
    return new BaseCollection<string, Member>();
  }

  get mention(): string {
    return `<@&${this.id}>`;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    {ignoreAdministrator}: {ignoreAdministrator?: boolean} = {},
  ): boolean {
    if (!ignoreAdministrator && PermissionTools.checkPermissions(this.permissions, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
  }

  permissionsIn(channelId: ChannelGuildBase | string): number {
    let channel: ChannelGuildBase;
    if (channelId instanceof ChannelGuildBase) {
      channel = channelId;
    } else {
      if (this.client.channels.has(channelId)) {
        channel = this.client.channels.get(channelId) as ChannelGuildBase;
      } else {
        return Permissions.NONE;
      }
    }

    let allow = 0, deny = 0;
    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = channel.permissionOverwrites.get(this.id) as Overwrite;
      allow |= overwrite.allow;
      deny |= overwrite.deny;
    }
    return (this.permissions & ~deny) | allow;
  }

  delete(options: RequestTypes.DeleteGuildRole = {}) {
    return this.client.rest.deleteGuildRole(this.guildId, this.id, options);
  }

  edit(options: RequestTypes.EditGuildRole) {
    return this.client.rest.editGuildRole(this.guildId, this.id, options);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.PERMISSIONS_NEW: {
        value = BigInt(value);
      }; break;
      case DiscordKeys.TAGS: {
        value = value || null;
      }; break;
    }
    return super.mergeValue(key, value);
  }

  toString(): string {
    return this.name;
  }
}
