import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";
import { getCurrentProfile, type Profile } from "~/services/profileService";

type SessionStatus = "idle" | "loading" | "authenticated" | "anonymous" | "error";
type ProfileStatus = "idle" | "loading" | "ready" | "missing" | "error";

type SessionState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  status: SessionStatus;
  profileStatus: ProfileStatus;
  error: string | null;
  profileError: string | null;
};

const initialState: SessionState = {
  session: null,
  user: null,
  profile: null,
  status: "idle",
  profileStatus: "idle",
  error: null,
  profileError: null,
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

export const loadProfile = createAsyncThunk("session/loadProfile", async () => {
  return getCurrentProfile();
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

      if (!action.payload) {
        state.profile = null;
        state.profileStatus = "idle";
        state.profileError = null;
      }
    },
    profileChanged(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
      state.profileStatus = action.payload ? "ready" : "missing";
      state.profileError = null;
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
        if (!action.payload) {
          state.profile = null;
          state.profileStatus = "idle";
        }
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Unable to load session.";
      })
      .addCase(loadProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.profileStatus = action.payload ? "ready" : "missing";
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.profile = null;
        state.profileStatus = "error";
        state.profileError = action.error.message ?? "Unable to load profile.";
      });
  },
});

export const { sessionChanged, profileChanged } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
