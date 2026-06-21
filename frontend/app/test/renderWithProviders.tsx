import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router";
import type { ReactElement, ReactNode } from "react";

import { sessionReducer } from "~/store/sessionSlice";
import type { RootState } from "~/store/store";

/* ---- Shared helpers ---- */

export type SessionState = RootState["session"];

type SessionStateOverrides = Omit<Partial<SessionState>, "session" | "user" | "profile"> & {
  session?: Partial<NonNullable<SessionState["session"]>> | SessionState["session"];
  user?: Partial<NonNullable<SessionState["user"]>> | SessionState["user"];
  profile?: (Partial<Omit<NonNullable<SessionState["profile"]>, "role">> & { role?: "creator" | "business" | "admin" }) | SessionState["profile"];
};

export const defaultSessionState: SessionState = {
  session: null,
  user: null,
  profile: null,
  status: "idle",
  profileStatus: "idle",
  error: null,
  profileError: null,
};

type ProviderOptions = {
  sessionState?: SessionStateOverrides;
  initialEntries?: string[];
} & Omit<RenderOptions, "wrapper">;

type ProviderResult = ReturnType<typeof render> & { store: ReturnType<typeof configureStore> };

/** Render a component wrapped with a Redux store and MemoryRouter.
 *  Provide `sessionState` to preconfigure the session slice.
 *  Provide `initialEntries` to control the initial URL for routing tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    sessionState = {},
    initialEntries = ["/"],
    ...renderOptions
  }: ProviderOptions = {},
): ProviderResult {
  const store = configureStore({
    reducer: { session: sessionReducer },
    preloadedState: { session: { ...defaultSessionState, ...sessionState } as SessionState },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
}
