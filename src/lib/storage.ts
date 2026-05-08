import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import * as Y from "yjs";
import { createInitialPracticeState } from "../features/practice/seed";
import type { PracticeState } from "../features/practice/types";
import { practiceStateSchema } from "../features/practice/schemas";

const dbName = "solo-practice-flow";
const storeName = "workspace";
const workspaceKey = "primary";
const rootKey = "state";

interface WorkspaceDb extends DBSchema {
  workspace: {
    key: string;
    value: Uint8Array;
  };
}

export interface WorkspaceDocument {
  doc: Y.Doc;
  getState: () => PracticeState;
  setState: (updater: (state: PracticeState) => PracticeState) => Promise<void>;
  reset: () => Promise<PracticeState>;
  subscribe: (listener: (state: PracticeState) => void) => () => void;
}

const parseState = (value: unknown): PracticeState => {
  if (typeof value !== "string") {
    return createInitialPracticeState();
  }

  try {
    const parsed = practiceStateSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : createInitialPracticeState();
  } catch {
    return createInitialPracticeState();
  }
};

const serialize = (state: PracticeState) =>
  JSON.stringify({
    ...state,
    updatedAt: new Date().toISOString(),
  });

const openWorkspaceDb = () =>
  openDB<WorkspaceDb>(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    },
  });

const persist = async (db: IDBPDatabase<WorkspaceDb>, doc: Y.Doc) => {
  await db.put(storeName, Y.encodeStateAsUpdate(doc), workspaceKey);
};

export const openWorkspaceDocument = async (): Promise<WorkspaceDocument> => {
  const db = await openWorkspaceDb();
  const doc = new Y.Doc();
  const update = await db.get(storeName, workspaceKey);
  if (update) {
    Y.applyUpdate(doc, update);
  }

  const root = doc.getMap<string>("root");
  if (!root.has(rootKey)) {
    root.set(rootKey, serialize(createInitialPracticeState()));
    await persist(db, doc);
  }

  const getState = () => parseState(root.get(rootKey));

  const setState = async (updater: (state: PracticeState) => PracticeState) => {
    const next = updater(getState());
    root.set(rootKey, serialize(next));
    await persist(db, doc);
  };

  const reset = async () => {
    const next = createInitialPracticeState();
    root.set(rootKey, serialize(next));
    await persist(db, doc);
    return next;
  };

  const subscribe = (listener: (state: PracticeState) => void) => {
    const observer = () => listener(getState());
    root.observe(observer);
    return () => root.unobserve(observer);
  };

  return { doc, getState, setState, reset, subscribe };
};
