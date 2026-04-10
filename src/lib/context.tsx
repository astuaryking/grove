// ============================================================
// Homestead Manager — App State Context
// ============================================================

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import type { AppData, Project, Section, Item, Event, ViewId } from "./types";
import { loadAppData, saveAppData } from "./storage";
import { nanoid } from "nanoid";

// --- State shape ---

export interface AppState {
  data: AppData;
  activeView: ViewId;
  activeProjectId: string | null;
  loaded: boolean;
}

const initialState: AppState = {
  data: { projects: [], version: 1 },
  activeView: "project",
  activeProjectId: null,
  loaded: false,
};

// --- Actions ---

export type AppAction =
  // Data loaded from storage
  | { type: "INIT"; data: AppData }

  // Navigation
  | { type: "SET_VIEW"; view: ViewId; projectId?: string }

  // Project CRUD
  | { type: "ADD_PROJECT"; project: Project }
  | { type: "UPDATE_PROJECT"; projectId: string; updates: Partial<Project> }
  | { type: "DELETE_PROJECT"; projectId: string }

  // Section CRUD (within a project)
  | { type: "ADD_SECTION"; projectId: string; section: Section }
  | { type: "UPDATE_SECTION"; projectId: string; sectionId: string; updates: Partial<Section> }
  | { type: "DELETE_SECTION"; projectId: string; sectionId: string }

  // Item CRUD (within a section)
  | { type: "ADD_ITEM"; projectId: string; sectionId: string; item: Item }
  | { type: "UPDATE_ITEM"; projectId: string; sectionId: string; itemId: string; updates: Partial<Item> }
  | { type: "DELETE_ITEM"; projectId: string; sectionId: string; itemId: string }

  // Event CRUD
  | { type: "ADD_EVENT"; projectId: string; event: Event }
  | { type: "UPDATE_EVENT"; projectId: string; eventId: string; updates: Partial<Event> }
  | { type: "DELETE_EVENT"; projectId: string; eventId: string }
  | { type: "TOGGLE_EVENT_DONE"; projectId: string; eventId: string; dateStr: string };

// --- Reducer ---

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        data: action.data,
        activeProjectId: action.data.projects[0]?.id ?? null,
        loaded: true,
      };

    case "SET_VIEW":
      return {
        ...state,
        activeView: action.view,
        activeProjectId: action.projectId ?? state.activeProjectId,
      };

    case "ADD_PROJECT":
      return {
        ...state,
        data: {
          ...state.data,
          projects: [...state.data.projects, action.project],
        },
        activeView: "project",
        activeProjectId: action.project.id,
      };

    case "UPDATE_PROJECT":
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.map((p) =>
            p.id === action.projectId ? { ...p, ...action.updates } : p
          ),
        },
      };

    case "DELETE_PROJECT": {
      const remaining = state.data.projects.filter((p) => p.id !== action.projectId);
      return {
        ...state,
        data: { ...state.data, projects: remaining },
        activeProjectId:
          state.activeProjectId === action.projectId
            ? remaining[0]?.id ?? null
            : state.activeProjectId,
      };
    }

    case "ADD_SECTION":
      return updateProject(state, action.projectId, (p) => ({
        sections: [...p.sections, action.section],
      }));

    case "UPDATE_SECTION":
      return updateProject(state, action.projectId, (p) => ({
        sections: p.sections.map((s) =>
          s.id === action.sectionId ? { ...s, ...action.updates } : s
        ),
      }));

    case "DELETE_SECTION":
      return updateProject(state, action.projectId, (p) => ({
        sections: p.sections.filter((s) => s.id !== action.sectionId),
      }));

    case "ADD_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({
        items: [...s.items, action.item],
      }));

    case "UPDATE_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({
        items: s.items.map((i) =>
          i.id === action.itemId ? { ...i, ...action.updates } : i
        ),
      }));

    case "DELETE_ITEM":
      return updateSection(state, action.projectId, action.sectionId, (s) => ({
        items: s.items.filter((i) => i.id !== action.itemId),
      }));

    case "ADD_EVENT":
      return updateProject(state, action.projectId, (p) => ({
        events: [...p.events, action.event],
      }));

    case "UPDATE_EVENT":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) =>
          e.id === action.eventId ? { ...e, ...action.updates } : e
        ),
      }));

    case "DELETE_EVENT":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.filter((e) => e.id !== action.eventId),
      }));

    case "TOGGLE_EVENT_DONE":
      return updateProject(state, action.projectId, (p) => ({
        events: p.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const done = e.completions.includes(action.dateStr);
          return {
            ...e,
            completions: done
              ? e.completions.filter((d) => d !== action.dateStr)
              : [...e.completions, action.dateStr],
          };
        }),
      }));

    default:
      return state;
  }
}

// --- Helpers ---

function updateProject(
  state: AppState,
  projectId: string,
  updater: (p: Project) => Partial<Project>
): AppState {
  return {
    ...state,
    data: {
      ...state.data,
      projects: state.data.projects.map((p) =>
        p.id === projectId ? { ...p, ...updater(p) } : p
      ),
    },
  };
}

function updateSection(
  state: AppState,
  projectId: string,
  sectionId: string,
  updater: (s: Section) => Partial<Section>
): AppState {
  return updateProject(state, projectId, (p) => ({
    sections: p.sections.map((s) =>
      s.id === sectionId ? { ...s, ...updater(s) } : s
    ),
  }));
}

// --- Context ---

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}

/**
 * Convenience: get the active project from state.
 */
export function useActiveProject(): Project | null {
  const state = useAppState();
  if (!state.activeProjectId) return null;
  return state.data.projects.find((p) => p.id === state.activeProjectId) ?? null;
}

// --- ID generation ---

export function newId(prefix: string = ""): string {
  return prefix ? `${prefix}_${nanoid(10)}` : nanoid(10);
}

// --- Provider ---

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadAppData();
    dispatch({ type: "INIT", data });
  }, []);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveAppData(state.data);
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state.data, state.loaded]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
