// ============================================================
// Grove — App State Context
// ============================================================

"use client";

import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode, type Dispatch } from "react";
import type { AppData, Project, Section, Item, Event, User, ShoppingItem, ViewId } from "./types";
import { loadAppData, saveAppData } from "./storage";
import { nanoid } from "nanoid";

// --- State ---

export interface AppState {
  data: AppData;
  activeView: ViewId;
  activeProjectId: string | null;
  loaded: boolean;
}

const initialState: AppState = {
  data: { projects: [], users: [], currentUserId: "", shoppingList: [], version: 3 },
  activeView: "today",
  activeProjectId: null,
  loaded: false,
};

// --- Actions ---

export type AppAction =
  | { type: "INIT"; data: AppData }
  | { type: "SET_VIEW"; view: ViewId; projectId?: string }

  // Profile & people
  | { type: "SET_MY_PROFILE"; updates: Partial<User> }          // rename yourself
  | { type: "ADD_PERSON"; user: User }                          // add a team member
  | { type: "UPDATE_PERSON"; userId: string; updates: Partial<User> }
  | { type: "DELETE_PERSON"; userId: string }

  // Projects
  | { type: "ADD_PROJECT"; project: Project }
  | { type: "UPDATE_PROJECT"; projectId: string; updates: Partial<Project> }
  | { type: "DELETE_PROJECT"; projectId: string }

  // Sections
  | { type: "ADD_SECTION"; projectId: string; section: Section }
  | { type: "UPDATE_SECTION"; projectId: string; sectionId: string; updates: Partial<Section> }
  | { type: "DELETE_SECTION"; projectId: string; sectionId: string }

  // Items
  | { type: "ADD_ITEM"; projectId: string; sectionId: string; item: Item }
  | { type: "UPDATE_ITEM"; projectId: string; sectionId: string; itemId: string; updates: Partial<Item> }
  | { type: "DELETE_ITEM"; projectId: string; sectionId: string; itemId: string }

  // Events
  | { type: "ADD_EVENT"; projectId: string; event: Event }
  | { type: "UPDATE_EVENT"; projectId: string; eventId: string; updates: Partial<Event> }
  | { type: "DELETE_EVENT"; projectId: string; eventId: string }
  | { type: "TOGGLE_EVENT_DONE"; projectId: string; eventId: string; dateStr: string; userId: string }
  | { type: "SET_INTENT"; projectId: string; eventId: string; dateStr: string; userId: string; note: string }
  | { type: "CLEAR_INTENT"; projectId: string; eventId: string; dateStr: string; userId: string }

  // Shopping
  | { type: "ADD_SHOPPING_ITEM"; item: ShoppingItem }
  | { type: "UPDATE_SHOPPING_ITEM"; itemId: string; updates: Partial<ShoppingItem> }
  | { type: "DELETE_SHOPPING_ITEM"; itemId: string }
  | { type: "TOGGLE_PURCHASED"; itemId: string; userId: string }

  // Chat
  | { type: "SAVE_CHAT"; projectId: string; messages: import("./types").ChatMessage[] };

// --- Reducer ---

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INIT":
      return { ...state, data: action.data, activeProjectId: action.data.projects[0]?.id ?? null, loaded: true };

    case "SET_VIEW":
      return { ...state, activeView: action.view, activeProjectId: action.projectId ?? state.activeProjectId };

    // --- Profile & people ---

    case "SET_MY_PROFILE":
      return {
        ...state,
        data: {
          ...state.data,
          users: state.data.users.map((u) =>
            u.id === state.data.currentUserId ? { ...u, ...action.updates } : u
          ),
        },
      };

    case "ADD_PERSON":
      return { ...state, data: { ...state.data, users: [...state.data.users, action.user] } };

    case "UPDATE_PERSON":
      return {
        ...state,
        data: { ...state.data, users: state.data.users.map((u) => u.id === action.userId ? { ...u, ...action.updates } : u) },
      };

    case "DELETE_PERSON": {
      const remaining = state.data.users.filter((u) => u.id !== action.userId);
      return { ...state, data: { ...state.data, users: remaining } };
    }

    // --- Projects ---

    case "ADD_PROJECT":
      return { ...state, data: { ...state.data, projects: [...state.data.projects, action.project] }, activeView: "project", activeProjectId: action.project.id };

    case "UPDATE_PROJECT":
      return { ...state, data: { ...state.data, projects: state.data.projects.map((p) => p.id === action.projectId ? { ...p, ...action.updates } : p) } };

    case "DELETE_PROJECT": {
      const remaining = state.data.projects.filter((p) => p.id !== action.projectId);
      return {
        ...state,
        data: { ...state.data, projects: remaining },
        activeProjectId: state.activeProjectId === action.projectId ? remaining[0]?.id ?? null : state.activeProjectId,
      };
    }

    // --- Sections ---

    case "ADD_SECTION":
      return updateProject(state, action.projectId, (p) => ({ sections: [...p.sections, action.section] }));

    case "UPDATE_SECTION":
      return updateProject(state, action.projectId, (p) => ({
        sections: p.sections.map((s) => s.id === action.sectionId ? { ...s, ...action.updates } : s),
      }));

    case "DELETE_SECTION":
      return updateProject(state, action.projectId, (p) => ({ sections: p.sections.filter((s) => s.id !== action.sectionId) }));

    // --- Items ---

    case "ADD_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({ items: [...s.items, action.item] }));

    case "UPDATE_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({
        items: s.items.map((i) => i.id === action.itemId ? { ...i, ...action.updates } : i),
      }));

    case "DELETE_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({ items: s.items.filter((i) => i.id !== action.itemId) }));

    // --- Events ---

    case "ADD_EVENT":
      return updateProject(state, action.projectId, (p) => ({ events: [...p.events, action.event] }));

    case "UPDATE_EVENT":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) => e.id === action.eventId ? { ...e, ...action.updates } : e),
      }));

    case "DELETE_EVENT":
      return updateProject(state, action.projectId, (p) => ({ events: p.events.filter((e) => e.id !== action.eventId) }));

    case "TOGGLE_EVENT_DONE":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const log = e.completionLog ?? [];
          const idx = log.findIndex((c) => c.date === action.dateStr && c.userId === action.userId);
          return {
            ...e,
            completionLog: idx >= 0
              ? log.filter((_, i) => i !== idx)
              : [...log, { date: action.dateStr, userId: action.userId, completedAt: new Date().toISOString() }],
          };
        }),
      }));

    case "SET_INTENT":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const intents = (e.intents ?? []).filter((i) => !(i.date === action.dateStr && i.userId === action.userId));
          return { ...e, intents: action.note.trim() ? [...intents, { date: action.dateStr, userId: action.userId, note: action.note.trim() }] : intents };
        }),
      }));

    case "CLEAR_INTENT":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) => {
          if (e.id !== action.eventId) return e;
          return { ...e, intents: (e.intents ?? []).filter((i) => !(i.date === action.dateStr && i.userId === action.userId)) };
        }),
      }));

    // --- Shopping ---

    case "ADD_SHOPPING_ITEM":
      return { ...state, data: { ...state.data, shoppingList: [...state.data.shoppingList, action.item] } };

    case "UPDATE_SHOPPING_ITEM":
      return {
        ...state,
        data: {
          ...state.data,
          shoppingList: state.data.shoppingList.map((i) => i.id === action.itemId ? { ...i, ...action.updates } : i),
        },
      };

    case "DELETE_SHOPPING_ITEM":
      return { ...state, data: { ...state.data, shoppingList: state.data.shoppingList.filter((i) => i.id !== action.itemId) } };

    case "TOGGLE_PURCHASED": {
      const now = new Date().toISOString();
      return {
        ...state,
        data: {
          ...state.data,
          shoppingList: state.data.shoppingList.map((i) =>
            i.id === action.itemId
              ? { ...i, purchased: !i.purchased, purchasedAt: !i.purchased ? now : undefined, purchasedBy: !i.purchased ? action.userId : undefined }
              : i
          ),
        },
      };
    }

    case "SAVE_CHAT":
      return updateProject(state, action.projectId, () => ({
        messages: action.messages.slice(-50),
      }));

    default:
      return state;
  }
}

// --- Helpers ---

function updateProject(state: AppState, projectId: string, updater: (p: Project) => Partial<Project>): AppState {
  return { ...state, data: { ...state.data, projects: state.data.projects.map((p) => p.id === projectId ? { ...p, ...updater(p) } : p) } };
}

function updateSection(state: AppState, projectId: string, sectionId: string, updater: (s: Section) => Partial<Section>): AppState {
  return updateProject(state, projectId, (p) => ({
    sections: p.sections.map((s) => s.id === sectionId ? { ...s, ...updater(s) } : s),
  }));
}

// --- Context ---

const AppStateContext   = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function useAppState()    { return useContext(AppStateContext); }
export function useAppDispatch() { return useContext(AppDispatchContext); }

export function useActiveProject() {
  const state = useAppState();
  if (!state.activeProjectId) return null;
  return state.data.projects.find((p) => p.id === state.activeProjectId) ?? null;
}

export function useCurrentUser() {
  const state = useAppState();
  return state.data.users.find((u) => u.id === state.data.currentUserId) ?? state.data.users[0] ?? null;
}

export function newId(prefix = "") {
  return prefix ? `${prefix}_${nanoid(10)}` : nanoid(10);
}

// --- Provider ---

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { dispatch({ type: "INIT", data: loadAppData() }); }, []);

  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveAppData(state.data), 500);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [state.data, state.loaded]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
