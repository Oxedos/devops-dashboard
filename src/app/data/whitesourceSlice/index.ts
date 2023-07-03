import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { whitesourceSaga } from './saga';
import { WhitesourceState } from './types';
import * as PersistanceAPI from 'app/apis/persistance';
import {
  WhitesourceProject,
  WhitesourceVulnerability,
} from 'app/apis/whitesource/types';

export const LOCALSTORAGE_KEY = 'whitesource_state';

const loadInitialState = (): WhitesourceState => {
  const persistedState: WhitesourceState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    configured: persistedState?.configured,
    url: persistedState?.url,
    userKey: persistedState?.userKey,
    productToken: persistedState?.productToken,
    vulnerabilities: persistedState?.vulnerabilities || [],
    projects: persistedState?.projects || [],
  };
};

export const initialState: WhitesourceState = loadInitialState();

const slice = createSlice({
  name: 'whitesource',
  initialState,
  reducers: {
    setConfigured(state, action: PayloadAction<boolean>) {
      state.configured = action.payload;
    },
    setUrl(state, action: PayloadAction<string | undefined>) {
      state.url = action.payload;
    },
    setUserKey(state, action: PayloadAction<string | undefined>) {
      state.userKey = action.payload;
    },
    setProductToken(state, action: PayloadAction<string | undefined>) {
      state.productToken = action.payload;
    },
    setVulnerabilities(
      state,
      action: PayloadAction<{ vulnerabilities: WhitesourceVulnerability[] }>,
    ) {
      state.vulnerabilities = action.payload.vulnerabilities;
    },
    setProjects(
      state,
      action: PayloadAction<{ projects: WhitesourceProject[] }>,
    ) {
      state.projects = action.payload.projects;
    },
    reload(state, action: PayloadAction<void>) {},
    deleteConfiguration(state, action: PayloadAction<void>) {
      return {
        configured: false,
        url: undefined,
        userKey: undefined,
        productToken: undefined,
        vulnerabilities: [],
        projects: [],
      };
    },
  },
});

export const name = slice.name;
export const { actions, reducer } = slice;
export const saga = whitesourceSaga;
