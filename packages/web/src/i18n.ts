type Lang = "en" | "ru";

const S = {
  en: {
    tagline: "Track progress with bars, not checkboxes.",
    startFresh: "Start Fresh",
    orSync: "or sync with another device",
    install: "📲 Install App",
    addTask: "Add a task...",
    newList: "+ New List",
    listName: "List name...",
    create: "Create",
    cancel: "Cancel",
    del: "Delete",
    close: "Close",
    notes: "Notes...",
    sync: "Sync another device",
    shareLink: "Share Link",
    completed: "Done!",
    undo: "Undo",
    emptyHint: "Create your first list to get started",
    confirmDelete: "Tap again to delete",
    avg: "avg",
    update: "Update available",
    refresh: "Refresh",
    taskTitle: "Task name...",
    dueDate: "Due date",
    overdue: "overdue",
    dueToday: "today",
    dueTomorrow: "tomorrow",
    dueIn: "in",
    days: "d",
    showMnemonic: "Show Mnemonic",
    hideMnemonic: "Hide Mnemonic",
    restoreFromMnemonic: "Restore from Mnemonic",
    mnemonicHint: "Save this phrase to sync across devices",
    resetAll: "Reset All Data",
    resetConfirm: "Delete all local data?",
    iosHint: "Tap ⎋ share → \"Add to Home Screen\"",
  },
  ru: {
    tagline: "Прогресс-бары вместо галочек.",
    startFresh: "Начать",
    orSync: "или синхронизировать",
    install: "📲 Установить",
    addTask: "Добавить задачу...",
    newList: "+ Новый список",
    listName: "Название списка...",
    create: "Создать",
    cancel: "Отмена",
    del: "Удалить",
    close: "Закрыть",
    notes: "Заметки...",
    sync: "Синхронизация",
    shareLink: "Поделиться ссылкой",
    completed: "Готово!",
    undo: "Отменить",
    emptyHint: "Создайте первый список",
    confirmDelete: "Ещё раз для удаления",
    avg: "ср",
    update: "Обновление",
    refresh: "Обновить",
    taskTitle: "Название задачи...",
    dueDate: "Срок",
    overdue: "просрочено",
    dueToday: "сегодня",
    dueTomorrow: "завтра",
    dueIn: "через",
    days: "д",
    showMnemonic: "Показать фразу",
    hideMnemonic: "Скрыть фразу",
    restoreFromMnemonic: "Восстановить из фразы",
    mnemonicHint: "Сохраните эту фразу для синхронизации",
    resetAll: "Сбросить данные",
    resetConfirm: "Удалить все локальные данные?",
    iosHint: "Нажмите ⎋ → «На экран Домой»",
  },
} as const;

type Strings = (typeof S)["en"];

const LANG_KEY = "bucket-lang";

function detect(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "ru") return stored;
  const nav = navigator.language.slice(0, 2);
  return ["ru", "ky", "kk", "uz", "tg"].includes(nav) ? "ru" : "en";
}

let current: Lang = detect();
const listeners = new Set<() => void>();

export function t<K extends keyof Strings>(key: K): string {
  return S[current][key];
}

export function getLang(): Lang { return current; }

export function setLang(lang: Lang) {
  current = lang;
  localStorage.setItem(LANG_KEY, lang);
  listeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
