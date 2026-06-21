import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";

import { supabase } from "~/lib/supabase";
import { loadProfile, loadSession, sessionChanged } from "~/store/sessionSlice";
import { store } from "~/store/store";

function SessionBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(loadSession()).unwrap().then((session) => {
      if (session) store.dispatch(loadProfile());
    }).catch(() => undefined);

    if (!supabase) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      store.dispatch(sessionChanged(session));
      if (session) store.dispatch(loadProfile());
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </Provider>
  );
}
