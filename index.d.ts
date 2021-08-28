/**
 * A A17-helperised version of [lazyload](https://github.com/area17/lazyload)
 * @link https://code.area17.com/a17/a17-helpers/wikis/lazyload
 * @param pageUpdatedEventName how your app tells the rest of the app an update happened
 * @param elemnts maybe you just want images?
 * @param rootMargin IntersectionObserver option
 * @param threshold IntersectionObserver option
 * @param maxFrameCount 60fps / 10 = 6 times a second
 *
 * @example
 *
 * _LazyLoad();
 *
 * _LazyLoad({
 *   pageUpdatedEventName: 'spfdone',
 *   elements: 'img[data-src]',
 *   rootMargin: '0px 0px 30% 0px',
 *   threshold: 0.1,
 *   maxFrameCount: 2,
 * });
 */
export default function lazyLoad(options: any): void;
