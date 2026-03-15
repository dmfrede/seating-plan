import { useState, useCallback } from 'react';

interface UndoRedoState<T> {
  history: T[];
  index: number;
}

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<UndoRedoState<T>>({
    history: [initialState],
    index: 0,
  });

  const current = state.history[state.index];
  const canUndo = state.index > 0;
  const canRedo = state.index < state.history.length - 1;

  const push = useCallback((newState: T) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.index + 1);
      return { history: [...newHistory, newState], index: prev.index + 1 };
    });
  }, []);

  // Update the current snapshot in-place without creating a history entry.
  // Used for continuous operations like table dragging.
  const replace = useCallback((newState: T) => {
    setState(prev => {
      const newHistory = [...prev.history];
      newHistory[prev.index] = newState;
      return { ...prev, history: newHistory };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.index <= 0) return prev;
      return { ...prev, index: prev.index - 1 };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.index >= prev.history.length - 1) return prev;
      return { ...prev, index: prev.index + 1 };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState({ history: [newState], index: 0 });
  }, []);

  return { current, push, replace, undo, redo, canUndo, canRedo, reset };
}
