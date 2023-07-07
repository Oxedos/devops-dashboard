import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'types';
import { initialState } from '.';

const selectSlice = (state: RootState) => state.rss || initialState;

export const selectRss = createSelector([selectSlice], state => state);
export const selectFeeds = createSelector([selectRss], state => state.feeds);
