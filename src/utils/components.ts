import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  DiscordRegexNames,
  MessageComponentButtonStyles,
  MessageComponentTypes,
} from '../constants';
import { GatewayRawEvents } from '../gateway/rawevents';
import { Structure } from '../structures/basestructure';
import { Emoji } from '../structures/emoji';
import { regex as discordRegex } from '../utils';



export type ComponentEmojiData = {animated?: boolean, id?: null | string, name: string} | string | Emoji;

export interface ComponentData extends Omit<Partial<GatewayRawEvents.RawMessageComponent>, 'emoji'> {
  customId?: string,
  emoji?: ComponentEmojiData,
  maxValues?: number,
  minValues?: number,
}

export interface ComponentSelectMenuOptionData extends Omit<Partial<GatewayRawEvents.RawMessageComponentSelectMenuOption>, 'emoji'> {
  emoji?: ComponentEmojiData,
}


const keysComponentActionRow = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Action Row Structure
 * @category Utils
 */
 export class ComponentActionRow extends Structure {
  readonly _keys = keysComponentActionRow;

  components: Array<ComponentButton | ComponentSelectMenu> = [];
  type = MessageComponentTypes.ACTION_ROW;

  constructor(data: ComponentData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.ACTION_ROW;
  }

  addButton(data: ComponentButton | ComponentData = {}): this {
    if (data instanceof ComponentButton) {
      return this.addComponent(data);
    }
    return this.addComponent(new ComponentButton(data));
  }

  addComponent(component: ComponentButton | ComponentSelectMenu): this {
    this.components.push(component);
    return this;
  }

  addSelectMenu(data: ComponentSelectMenu | ComponentData = {}): this {
    if (data instanceof ComponentSelectMenu) {
      return this.addComponent(data);
    }
    return this.addComponent(new ComponentSelectMenu(data));
  }

  createButton(data: ComponentData = {}): ComponentButton {
    const component = new ComponentButton(data);
    this.addComponent(component);
    return component;
  }

  createSelectMenu(data: ComponentData = {}): ComponentSelectMenu {
    const component = new ComponentSelectMenu(data);
    this.addComponent(component);
    return component;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.COMPONENTS: {
        this.components.length = 0;
        for (let raw of value) {
          switch (raw.type) {
            case MessageComponentTypes.BUTTON: {
              const component = new ComponentButton(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.SELECT_MENU: {
              const component = new ComponentSelectMenu(raw);
              this.components.push(component);
            }; break;
            default: {
              throw new Error(`Unknown component type ${raw.type}`);
            };
          }
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}


const keysComponentButton = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DISABLED,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.STYLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

/**
 * Utils Component Button Structure
 * @category Utils
 */
 export class ComponentButton extends Structure {
  readonly _keys = keysComponentButton;

  customId?: null | string;
  disabled?: boolean;
  emoji?: null | ComponentEmojiData;
  label?: null | string;
  style: MessageComponentButtonStyles = MessageComponentButtonStyles.PRIMARY;
  type = MessageComponentTypes.BUTTON;
  url?: null | string;

  constructor(data: ComponentData = {}) {
    super();
    if (DetritusKeys[DiscordKeys.CUSTOM_ID] in data) {
      (data as any)[DiscordKeys.CUSTOM_ID] = (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]];
    }
    this.merge(data);
    this.type = MessageComponentTypes.BUTTON;
  }

  setCustomId(customId: null | string): this {
    this.merge({custom_id: customId});
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.merge({disabled});
    return this;
  }

  setEmoji(emoji: null | ComponentEmojiData): this {
    this.merge({emoji});
    return this;
  }

  setLabel(label: null | string): this {
    this.merge({label});
    return this;
  }

  setStyle(style: MessageComponentButtonStyles): this {
    this.merge({style});
    return this;
  }

  setUrl(url: null | string): this {
    this.merge({url});
    if (url) {
      this.setStyle(MessageComponentButtonStyles.LINK);
    }
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.EMOJI: {
        if (value instanceof Emoji) {
          value = {animated: value.animated, id: value.id, name: value.name};
        } else if (typeof(value) === 'string') {
          const { matches } = discordRegex(DiscordRegexNames.EMOJI, value);
          if (matches.length) {
            value = matches[0];
          } else {
            value = {name: value};
          }
        }
      }; break;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    const data = super.toJSON() as any;
    if (data.emoji instanceof Emoji) {
      data.emoji = {animated: data.emoji.animated, id: data.emoji.id, name: data.emoji.name};
    }
    return data;
  }
}


const keysComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Select Menu Structure
 * @category Utils
 */
 export class ComponentSelectMenu extends Structure {
  readonly _keys = keysComponentSelectMenu;

  customId: string = '';
  maxValues?: null | number;
  minValues?: null | number;
  options: Array<ComponentSelectMenuOption> = [];
  placeholder?: null | string;
  type = MessageComponentTypes.SELECT_MENU;

  constructor(data: ComponentData = {}) {
    super();
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.MAX_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] || (data as any)[DiscordKeys.MAX_VALUES],
      [DiscordKeys.MIN_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] || (data as any)[DiscordKeys.MIN_VALUES],
    });
    this.merge(data);
    this.type = MessageComponentTypes.SELECT_MENU;
  }

  addOption(option: ComponentSelectMenuOption): this {
    this.options.push(option);
    return this;
  }

  createOption(data: ComponentSelectMenuOptionData = {}): ComponentSelectMenuOption {
    const option = new ComponentSelectMenuOption(data);
    this.addOption(option);
    return option;
  }

  setCustomId(customId: string): this {
    this.merge({custom_id: customId});
    return this;
  }

  setMaxValues(maxValues: null | number): this {
    this.merge({max_values: maxValues});
    return this;
  }

  setMinValues(minValues: null | number): this {
    this.merge({min_values: minValues});
    return this;
  }

  setPlaceholder(placeholder: null | string): this {
    this.merge({placeholder});
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.OPTIONS: {
        this.options.length = 0;
        for (let raw of value) {
          const option = new ComponentSelectMenuOption(raw);
          this.options.push(option);
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}


const keysComponentSelectMenuOption = new BaseSet<string>([
  DiscordKeys.DEFAULT,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.VALUE,
]);

/**
 * Utils Component Select Menu Option Structure
 * @category Utils
 */
 export class ComponentSelectMenuOption extends Structure {
  readonly _keys = keysComponentSelectMenuOption;

  default?: boolean;
  description?: null | string;
  emoji?: null | ComponentEmojiData;
  label: string = '';
  value: string = '';

  constructor(data: ComponentSelectMenuOptionData = {}) {
    super();
    this.merge(data);
  }

  setDefault(isDefault: boolean): this {
    this.merge({default: isDefault});
    return this;
  }

  setDescription(description: null | string): this {
    this.merge({description});
    return this;
  }

  setEmoji(emoji: null | ComponentEmojiData): this {
    this.merge({emoji});
    return this;
  }

  setLabel(label: string): this {
    this.merge({label});
    return this;
  }

  setValue(value: string): this {
    this.merge({value});
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.EMOJI: {
        if (value instanceof Emoji) {
          value = {animated: value.animated, id: value.id, name: value.name};
        } else if (typeof(value) === 'string') {
          const { matches } = discordRegex(DiscordRegexNames.EMOJI, value);
          if (matches.length) {
            value = matches[0];
          } else {
            value = {name: value};
          }
        }
      }; break;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponentSelectMenuOption {
    const data = super.toJSON() as any;
    if (data.emoji instanceof Emoji) {
      data.emoji = {animated: data.emoji.animated, id: data.emoji.id, name: data.emoji.name};
    }
    return data;
  }
}
