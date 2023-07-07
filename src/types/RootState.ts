import { GitLabState } from 'app/data/gitLabSlice/types';
import { GlobalState } from 'app/data/globalSlice/types';
import { RssState } from 'app/data/rssSlice/types';
import { WhitesourceState } from 'app/data/whitesourceSlice/types';

// [IMPORT NEW CONTAINERSTATE ABOVE] < Needed for generating containers seamlessly

/* 
  Because the redux-injectors injects your reducers asynchronously somewhere in your code
  You have to declare them here manually
*/
export interface RootState {
  global?: GlobalState;
  gitLab?: GitLabState;
  whitesource?: WhitesourceState;
  rss?: RssState;
  // [INSERT NEW REDUCER KEY ABOVE] < Needed for generating containers seamlessly
}
