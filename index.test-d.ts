import {expectType} from 'tsd';
import lazyLoad from './index.js';

expectType<void>(lazyLoad({}));
