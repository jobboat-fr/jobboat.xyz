import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { setActivityCallback } from '../services/apiClient';

const MAX_ITEMS = 8;
const EXPIRE_MS = 6000; // remove completed entries after 6s

const ActivityContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const next = [action.item, ...state.filter(i => i.id !== action.item.id)].slice(0, MAX_ITEMS);
      return next;
    }
    case 'UPDATE': {
      return state.map(i => i.id === action.id ? { ...i, ...action.patch } : i);
    }
    case 'REMOVE': {
      return state.filter(i => i.id !== action.id);
    }
    case 'CLEAR': {
      return state.filter(i => i.status === 'pending');
    }
    default:
      return state;
  }
}

export function ActivityProvider({ children }) {
  const [activities, dispatch] = useReducer(reducer, []);
  const timers = useRef({});

  const push = useCallback((event) => {
    if (event.status === 'pending') {
      dispatch({ type: 'ADD', item: { ...event, startedAt: Date.now() } });
    } else {
      dispatch({ type: 'UPDATE', id: event.id, patch: { status: event.status, endedAt: Date.now() } });
      if (timers.current[event.id]) clearTimeout(timers.current[event.id]);
      timers.current[event.id] = setTimeout(() => {
        dispatch({ type: 'REMOVE', id: event.id });
        delete timers.current[event.id];
      }, EXPIRE_MS);
    }
  }, []);

  useEffect(() => {
    setActivityCallback(push);
    return () => setActivityCallback(null);
  }, [push]);

  return (
    <ActivityContext.Provider value={{ activities, push }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
