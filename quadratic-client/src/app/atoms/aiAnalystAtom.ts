import { aiAnalystOfflineChats } from '@/app/ai/offline/aiAnalystChats';
import { getPromptMessages } from '@/app/ai/tools/message.helper';
import { editorInteractionStateUserAtom, editorInteractionStateUuidAtom } from '@/app/atoms/editorInteractionStateAtom';
import { sheets } from '@/app/grid/controller/Sheets';
import { focusGrid } from '@/app/helpers/focusGrid';
import { Chat, ChatMessage } from 'quadratic-shared/typesAndSchemasAI';
import { atom, DefaultValue, selector } from 'recoil';
import { v4 } from 'uuid';

export interface AIAnalystState {
  showAIAnalyst: boolean;
  showChatHistory: boolean;
  abortController?: AbortController;
  loading: boolean;
  chats: Chat[];
  currentChat: Chat;
}

export const defaultAIAnalystState: AIAnalystState = {
  showAIAnalyst: false,
  showChatHistory: false,
  abortController: undefined,
  loading: false,
  chats: [],
  currentChat: {
    id: '',
    name: '',
    lastUpdated: Date.now(),
    messages: [],
  },
};

export const aiAnalystAtom = atom<AIAnalystState>({
  key: 'aiAnalystAtom',
  default: defaultAIAnalystState,
  effects: [
    async ({ getPromise, setSelf, trigger }) => {
      if (trigger === 'get') {
        // Determine if we want to override the default showAIAnalyst value on initialization
        const aiAnalystOpenCount = getAiAnalystOpenCount();
        const isSheetEmpty = sheets.sheet.bounds.type === 'empty';
        const showAIAnalyst = aiAnalystOpenCount <= 3 ? true : isSheetEmpty;
        if (showAIAnalyst) {
          setSelf({
            ...defaultAIAnalystState,
            showAIAnalyst,
          });
        }

        const user = await getPromise(editorInteractionStateUserAtom);
        const uuid = await getPromise(editorInteractionStateUuidAtom);
        if (!!user?.email && uuid) {
          try {
            await aiAnalystOfflineChats.init(user.email, uuid);
            const chats = await aiAnalystOfflineChats.loadChats();
            setSelf({
              ...defaultAIAnalystState,
              showAIAnalyst,
              chats,
            });
          } catch (error) {
            console.error('[AIAnalystOfflineChats]: ', error);
          }
        }
      }
    },
    ({ onSet }) => {
      onSet((newValue, oldValue) => {
        if (oldValue instanceof DefaultValue) {
          return;
        }

        if (oldValue.showAIAnalyst && !newValue.showAIAnalyst) {
          focusGrid();
        }
      });
    },
  ],
});

const createSelector = <T extends keyof AIAnalystState>(key: T) =>
  selector<AIAnalystState[T]>({
    key: `aiAnalyst${key.charAt(0).toUpperCase() + key.slice(1)}Atom`,
    get: ({ get }) => get(aiAnalystAtom)[key],
    set: ({ set }, newValue) => {
      set(aiAnalystAtom, (prev) => ({
        ...prev,
        [key]: newValue instanceof DefaultValue ? prev[key] : newValue,
      }));
    },
  });
export const showAIAnalystAtom = createSelector('showAIAnalyst');
export const aiAnalystShowChatHistoryAtom = createSelector('showChatHistory');
export const aiAnalystAbortControllerAtom = createSelector('abortController');

export const aiAnalystLoadingAtom = selector<boolean>({
  key: 'aiAnalystLoadingAtom',
  get: ({ get }) => get(aiAnalystAtom).loading,
  set: ({ set }, newValue) => {
    set(aiAnalystAtom, (prev) => {
      if (newValue instanceof DefaultValue) {
        return prev;
      }

      if (prev.loading && !newValue) {
        // save chat after new message is finished loading
        const currentChat = prev.currentChat;
        if (currentChat.id) {
          aiAnalystOfflineChats.saveChats([currentChat]).catch((error) => {
            console.error('[AIAnalystOfflineChats]: ', error);
          });
        }
      }

      return {
        ...prev,
        loading: newValue,
      };
    });
  },
});

export const aiAnalystChatsAtom = selector<Chat[]>({
  key: 'aiAnalystChatsAtom',
  get: ({ get }) => get(aiAnalystAtom).chats,
  set: ({ set }, newValue) => {
    set(aiAnalystAtom, (prev) => {
      if (newValue instanceof DefaultValue) {
        return prev;
      }

      // find deleted chats that are not in the new value
      const deletedChatIds = prev.chats
        .filter((chat) => !newValue.some((newChat) => newChat.id === chat.id))
        .map((chat) => chat.id);
      // delete offline chats
      if (deletedChatIds.length > 0) {
        aiAnalystOfflineChats.deleteChats(deletedChatIds).catch((error) => {
          console.error('[AIAnalystOfflineChats]: ', error);
        });
      }

      // find changed chats
      const changedChats = newValue.reduce<Chat[]>((acc, chat) => {
        const prevChat = prev.chats.find((prevChat) => prevChat.id === chat.id);
        if (!prevChat) {
          acc.push(chat);
        } else if (
          prevChat.name !== chat.name ||
          prevChat.lastUpdated !== chat.lastUpdated ||
          prevChat.messages !== chat.messages
        ) {
          acc.push(chat);
        }

        return acc;
      }, []);
      // save changed chats
      if (changedChats.length > 0) {
        aiAnalystOfflineChats.saveChats(changedChats).catch((error) => {
          console.error('[AIAnalystOfflineChats]: ', error);
        });
      }

      return {
        ...prev,
        showChatHistory: newValue.length > 0 ? prev.showChatHistory : false,
        chats: newValue,
        currentChat: deletedChatIds.includes(prev.currentChat.id)
          ? {
              id: '',
              name: '',
              lastUpdated: Date.now(),
              messages: [],
            }
          : prev.currentChat,
      };
    });
  },
});

export const aiAnalystChatsCountAtom = selector<number>({
  key: 'aiAnalystChatsCountAtom',
  get: ({ get }) => get(aiAnalystChatsAtom).length,
});

export const aiAnalystCurrentChatAtom = selector<Chat>({
  key: 'aiAnalystCurrentChatAtom',
  get: ({ get }) => get(aiAnalystAtom).currentChat,
  set: ({ set }, newValue) => {
    set(aiAnalystAtom, (prev) => {
      if (newValue instanceof DefaultValue) {
        return prev;
      }

      let chats = prev.chats;
      if (newValue.id) {
        chats = [...chats.filter((chat) => chat.id !== newValue.id), newValue];
      }

      return {
        ...prev,
        showChatHistory: false,
        chats,
        currentChat: newValue,
      };
    });
  },
});

export const aiAnalystCurrentChatNameAtom = selector<string>({
  key: 'aiAnalystCurrentChatNameAtom',
  get: ({ get }) => get(aiAnalystCurrentChatAtom).name,
  set: ({ set }, newValue) => {
    set(aiAnalystAtom, (prev) => {
      if (newValue instanceof DefaultValue) {
        return prev;
      }

      // update current chat
      const currentChat: Chat = {
        ...prev.currentChat,
        id: !!prev.currentChat.id ? prev.currentChat.id : v4(),
        name: newValue,
      };

      // update chats
      const chats = [...prev.chats.filter((chat) => chat.id !== currentChat.id), currentChat];

      // save chat with new name
      aiAnalystOfflineChats.saveChats([currentChat]).catch((error) => {
        console.error('[AIAnalystOfflineChats]: ', error);
      });

      return {
        ...prev,
        chats,
        currentChat,
      };
    });
  },
});

export const aiAnalystCurrentChatMessagesAtom = selector<ChatMessage[]>({
  key: 'aiAnalystCurrentChatMessagesAtom',
  get: ({ get }) => get(aiAnalystCurrentChatAtom).messages,
  set: ({ set }, newValue) => {
    set(aiAnalystAtom, (prev) => {
      if (newValue instanceof DefaultValue) {
        return prev;
      }

      // update current chat
      const currentChat: Chat = {
        id: prev.currentChat.id ? prev.currentChat.id : v4(),
        name: prev.currentChat.name,
        lastUpdated: Date.now(),
        messages: newValue,
      };

      // update chats
      const chats = [...prev.chats.filter((chat) => chat.id !== currentChat.id), currentChat];

      return {
        ...prev,
        chats,
        currentChat,
      };
    });
  },
});

export const aiAnalystCurrentChatMessagesCountAtom = selector<number>({
  key: 'aiAnalystCurrentChatMessagesCountAtom',
  get: ({ get }) => getPromptMessages(get(aiAnalystCurrentChatAtom).messages).length,
});

const STORAGE_KEY = 'aiAnalystOpenCount';
export function getAiAnalystOpenCount() {
  const count = window.localStorage.getItem(STORAGE_KEY);
  return count ? parseInt(count) : 0;
}
export function incrementAiAnalystOpenCount() {
  const count = getAiAnalystOpenCount();
  const newCount = count + 1;
  window.localStorage.setItem(STORAGE_KEY, newCount.toString());
}