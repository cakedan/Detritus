import { CommandArgumentTypes } from '../constants';

import { ArgumentParser } from './argumentparser';
import { Context } from './context';


export type ArgumentConverter = (value: string, context: Context) => Promise<any> | any;

export type ArgumentDefault = ((context: Context) => Promise<any> | any) | any;

export type ArgumentType = ArgumentConverter | Boolean | Number | String | CommandArgumentTypes | Array<ArgumentOptions>;

/**
 * Command Argument Options
 * @category Command Options
 */
export interface ArgumentOptions {
  aliases?: Array<string>,
  choices?: Array<any>,
  consume?: boolean,
  default?: ArgumentDefault,
  help?: string,
  label?: string,
  metadata?: {[key: string]: any},
  name: string,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  required?: boolean,
  type?: ArgumentType,
}


const blankPrefixes = Object.freeze(['']);

/**
 * Command Argument
 * @category Command
 */
export class Argument {
  private _aliases: Array<string> = [];
  private _label: string = '';
  private _name: string = '';
  private _names?: Array<string>;
  private _type: ArgumentType = CommandArgumentTypes.STRING;

  positionalArgs?: ArgumentParser;
  choices?: Array<any>;
  consume?: boolean = false;
  default: ArgumentDefault = undefined;
  help: string = '';
  metadata?: {[key: string]: any};
  prefixes: Set<string> = new Set(['-']);
  required: boolean = false;

  constructor(options: ArgumentOptions) {
    options = Object.assign({}, options);

    if (options.metadata !== undefined) {
      this.metadata = Object.assign({}, options.metadata);
    }
    if (options.prefix !== undefined) {
      if (!options.prefixes) {
        options.prefixes = [];
      }
      options.prefixes.push(options.prefix);
    }
    if (options.prefixes) {
      this.setPrefixes(options.prefixes, options.prefixSpace);
    }

    this.choices = options.choices;
    this.consume = !!options.consume;
    this.default = options.default;
    this.help = options.help || this.help;
    this.name = (options.name || this.name).toLowerCase();
    this.required = !!options.required;
    if (options.aliases) {
      this.aliases = options.aliases;
    }
    if (options.label) {
      this.label = options.label;
    }
    if (options.type) {
      this.type = options.type;
    }
  }

  get aliases(): Array<string> {
    return this._aliases;
  }

  set aliases(value: Array<string>) {
    this._aliases = (value || []).map((alias) => alias.toLowerCase());
    this._names = undefined;
  }

  get label(): string {
    return this._label || this.name;
  }

  set label(value: string) {
    this._label = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
    this._names = undefined;
  }

  get names(): Array<string> {
    if (this._names) {
      return this._names;
    }
    const names: Array<string> = [];
    const prefixes = (this.prefixes.size) ? this.prefixes : blankPrefixes;
    for (let prefix of prefixes) {
      names.push((prefix) ? prefix + this.name : this.name);
      for (let alias of this.aliases) {
        names.push((prefix) ? prefix + alias : alias);
      }
    }
    return this._names = names.sort((x, y) => y.length - x.length);
  }

  get type(): ArgumentType {
    return this._type;
  }

  set type(value: ArgumentType) {
    switch (value) {
      case Boolean: {
        value = CommandArgumentTypes.BOOL;
      }; break;
      case Number: {
        value = CommandArgumentTypes.NUMBER;
      }; break;
      case String: {
        value = CommandArgumentTypes.STRING;
      }; break;
    }

    this._type = (value || this.type);
    if (typeof(this.default) !== 'function') {
      switch (this.type) {
        case CommandArgumentTypes.BOOL: {
          this.default = !!this.default;
        }; break;
      }
    }

    if (Array.isArray(value)) {
      this.positionalArgs = new ArgumentParser(value, true);
    } else {
      this.positionalArgs = undefined;
    }
  }

  check(name: string): boolean {
    return this.names.some((n) => n === name);
  }

  getInfo(content: string): {index: number, name: string} {
    const info = {index: -1, name: ''};

    for (let name of this.names) {
      const index = content.indexOf(name);
      if (index !== -1) {
        info.index = index;
        info.name = name;
        break;
      }
    }

    return info;
  }

  getName(content: string): null | string {
    for (let name of this.names) {
      if (name.includes(' ')) {
        const parts = name.split(' ');
        let matches = true;

        let copy = content;
        let store: string = '';
        for (let [key, part] of parts.entries()) {
          if (copy.length === part.length) {
            if (copy === part) {
              store += copy;
              copy = '';
              continue;
            }
          } else {
            if (copy.startsWith(part + ' ')) {
              store += part;
              copy = copy.slice(part.length);
              if (key !== (parts.length - 1)) {
                while (copy.startsWith(' ')) {
                  store += ' ';
                  copy = copy.slice(1);
                }
              }
              continue;
            }
          }
          matches = false;
          break;
        }
        if (matches) {
          return store;
        }
      } else {
        if (content.length === name.length) {
          if (content === name) {
            return name;
          }
        } else {
          if (content.startsWith(name + ' ')) {
            return name;
          }
        }
      }
    }
    return null;
  }

  setPrefixes(prefixes: Array<string>, prefixSpace: boolean = false): void {
    prefixes = prefixes.slice().sort((x, y) => y.length - x.length);

    if (prefixes.some((prefix) => prefix.endsWith(' '))) {
      prefixSpace = true;
    }

    this.prefixes.clear();
    for (let prefix of prefixes) {
      if (!prefix) {
        continue;
      }

      prefix = prefix.trim();
      if (prefixSpace) {
        prefix += ' ';
      }
      if (prefix) {
        this.prefixes.add(prefix);
      }
    }
    this._names = undefined;
  }

  async parse(value: string, context: Context): Promise<any> {
    let parsedValue: any;
    if (typeof(this.type) === 'function') {
      parsedValue = await Promise.resolve(this.type(value, context));
    } else {
      try {
        switch (this.type) {
          case CommandArgumentTypes.BOOL: {
            parsedValue = !this.default;
          }; break;
          case CommandArgumentTypes.FLOAT: {
            parsedValue = parseFloat(value);
          }; break;
          case CommandArgumentTypes.NUMBER: {
            parsedValue = parseInt(value);
          }; break;
          case CommandArgumentTypes.STRING: {
            parsedValue = value || this.default || value;
          }; break;
          default: {
            parsedValue = value || this.default;
          }; break;
        }
      } catch(error) {
        if (this.help) {
          throw new Error(this.help.replace(/:error/g, error.message));
        } else {
          throw error;
        }
      }
    }
    if (this.choices) {
      if (!this.choices.includes(parsedValue)) {
        throw new Error(this.help || `${parsedValue} is not a valid choice`);
      }
    }
    return parsedValue;
  }
}
