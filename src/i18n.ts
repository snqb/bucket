type Lang = "en" | "ru";

const S = {
  en: {
    tagline: "Track progress with bars, not checkboxes.",
    startFresh: "Start Fresh",
    orSync: "— or sync with another device —",
    scanQR: "📷 Scan QR Code",
    pasteRoom: "Paste room ID...",
    join: "Join",
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
    saveQR: "💾 Save QR",
    copyID: "📋 Copy ID",
    shareLink: "Share Link",
    leave: "Leave room",
    completed: "Done!",
    undo: "Undo",
    emptyHint: "Create your first list to get started",
    qrIOS: "Use your Camera app to scan QR codes — it will open the link automatically.",
    qrUnsupported: "QR scanning not supported. Paste the room ID instead.",
    confirmDelete: "Tap again to delete",
    avg: "avg",
    update: "Update available",
    refresh: "Refresh",
    leaveConfirm: "Leave this room?",
    iosHint: "Tap ⎋ share → \"Add to Home Screen\"",
    taskTitle: "Task name...",
  },
  ru: {
    tagline: "Прогресс-бары вместо галочек.",
    startFresh: "Начать",
    orSync: "— или синхронизировать —",
    scanQR: "📷 Сканировать QR",
    pasteRoom: "Вставить ID комнаты...",
    join: "Войти",
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
    saveQR: "💾 Сохранить",
    copyID: "📋 Скопировать",
    shareLink: "Поделиться ссылкой",
    leave: "Выйти",
    completed: "Готово!",
    undo: "Отменить",
    emptyHint: "Создайте первый список",
    qrIOS: "Откройте Камеру и наведите на QR — ссылка откроется автоматически.",
    qrUnsupported: "QR не поддерживается. Вставьте ID комнаты.",
    confirmDelete: "Ещё раз для удаления",
    avg: "ср",
    update: "Обновление",
    refresh: "Обновить",
    leaveConfirm: "Выйти из комнаты?",
    iosHint: "Нажмите ⎋ → «На экран Домой»",
    taskTitle: "Название задачи...",
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
const langListeners = new Set<() => void>();

export function t<K extends keyof Strings>(key: K): string {
  return S[current][key];
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  localStorage.setItem(LANG_KEY, lang);
  langListeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void): () => void {
  langListeners.add(fn);
  return () => langListeners.delete(fn);
}
