import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";

type SessionStatus = "idle" | "loading" | "authenticated" | "anonymous" | "error";

type SessionState = {
  session: Session | null;
  user: User | null;
  status: SessionStatus;
  error: string | null;
};

const initialState: SessionState = {
  session: null,
  user: null,
  status: "idle",
  error: null,
};

export const loadSession = createAsyncThunk("session/load", async () => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
});

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    sessionChanged(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.status = action.payload ? "authenticated" : "anonymous";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.user = action.payload?.user ?? null;
        state.status = action.payload ? "authenticated" : "anonymous";
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Unable to load session.";
      });
  },
});

export const { sessionChanged } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
