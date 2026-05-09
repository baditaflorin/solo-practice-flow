import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialPracticeState } from "./seed";
import type { PracticeState } from "./types";
import {
  openWorkspaceDocument,
  type WorkspaceDocument,
} from "../../lib/storage";

export const usePracticeWorkspace = () => {
  const workspaceRef = useRef<WorkspaceDocument | null>(null);
  const [state, setStateSnapshot] = useState<PracticeState>(
    createInitialPracticeState,
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    openWorkspaceDocument()
      .then((workspace) => {
        if (cancelled) {
          return;
        }
        workspaceRef.current = workspace;
        setStateSnapshot(workspace.getState());
        unsubscribe = workspace.subscribe(setStateSnapshot);
        setReady(true);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to open local workspace",
        );
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const updateState = useCallback(
    async (updater: (state: PracticeState) => PracticeState) => {
      if (!workspaceRef.current) {
        return;
      }
      await workspaceRef.current.setState(updater);
    },
    [],
  );

  const reset = useCallback(async () => {
    if (!workspaceRef.current) {
      return;
    }
    const next = await workspaceRef.current.reset();
    setStateSnapshot(next);
    return next;
  }, []);

  return {
    state,
    ready,
    error,
    updateState,
    reset,
  };
};
