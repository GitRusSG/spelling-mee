import { MMKV } from 'react-native-mmkv';
import { WordList, CustomWordList, BuiltinWordList } from '../types';

const CUSTOM_LISTS_KEY = 'custom_lists';

export class WordListRepository {
  private storage: MMKV;
  private builtinLists: BuiltinWordList[];

  constructor(storage: MMKV, builtinLists: BuiltinWordList[]) {
    this.storage = storage;
    this.builtinLists = builtinLists;
  }

  getAll(): WordList[] {
    return [...this.builtinLists, ...this.getCustomLists()];
  }

  getById(id: string): WordList | undefined {
    return this.getAll().find((list) => list.id === id);
  }

  save(list: CustomWordList): void {
    const lists = this.getCustomLists();
    const index = lists.findIndex((l) => l.id === list.id);
    if (index >= 0) {
      lists[index] = list;
    } else {
      lists.push(list);
    }
    this.storage.set(CUSTOM_LISTS_KEY, JSON.stringify(lists));
  }

  delete(id: string): void {
    const lists = this.getCustomLists().filter((l) => l.id !== id);
    this.storage.set(CUSTOM_LISTS_KEY, JSON.stringify(lists));
  }

  private getCustomLists(): CustomWordList[] {
    const raw = this.storage.getString(CUSTOM_LISTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CustomWordList[];
    } catch {
      return [];
    }
  }
}
