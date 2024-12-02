---
title: improving performance of bsky-bc so i don't have to add real pagination yet
description: css for the search filter was a good idea
pubDate: 2024-12-01
unlisted: false
---
i'm up to about 7k albums collected on [`bsky-bc`](/bsky-bc). on my phone it's still working smoothly, but on desktop it's not doing so hot—something was causing it to block the main thread long enough to get the "this page is fucked, wait/kill" dialog. no good!!

i'll eventually have to add some sort of real pagination, but i'm determined to underengineer this, so the quickest thing i could think of was slice off batches from the big albums array, add them in a way that lets the browser a chance to catch its breath. more or less:

```js
function renderAlbums(albums) {
    const currentPage = albums.slice(0, PAGE_SIZE);
    for (const album of currentPage) {
        renderAlbum(album);
    }
    const nextPage = albums.slice(PAGE_SIZE);
    if (nextPage.length === 0) {
        return;
    }
    setTimeout(() => {
        requestAnimationFrame(() => {
            renderAlbums(nextPage);
        })
    }, PAGE_DELAY);
}
renderAlbums(allTheAlbums);
```

i hoped to rely on [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) without a timeout but that didn't work. i could use just the timeout, but it's nice to have the `raf` in there to stop doing work until the browser can get the next frame (e.g. user tabbed away).

this worked, even with a pretty large `PAGE_SIZE` and pretty short `PAGE_DELAY`, but now it does take actual time for albums to land in the DOM, so when loading a page with a filter applied, it's hard to tell if it didn't find any results or it didn't find any results _yet_. ugh i guess i have to add a loading indicator somewhere.

i think once the data file gets larger than a floppy disk of transferred data i'll start trying to implement some real form of pagination.

## `DocumentFragment` was utterly unhelpful for my use case

the moment i create an element i smash it right into the live DOM immediately because that was the fastest thing to do, programming-wise.

that might not be the fastest thing to do computers-doing-work-wise, so i tried using [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) to build up fragments before adding, see if that was better.

turns out it's ✨_much worse_✨! 

the [docs linked above and also right here](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment#performance) say that might be the case:

> The performance benefit of `DocumentFragment` is often overstated. In fact, in some engines, using a `DocumentFragment` is slower than appending to the document in a loop as demonstrated in [this benchmark](https://jsbench.me/02l63eic9j/1) [_ed note: hi [jake](https://jakearchibald.com/)!_] . However, the difference between these examples is so marginal that it's better to optimize for readability than performance.

there's no significant difference between strategies in the microbenchmark (there is often a difference, but it's not significant, and the winner will change from run to run), but in my application it felt much worse. 

love it when the straightforward way turns out to be the best way![^1]

aside: safari is really good at adding elements to the DOM.  i ran that microbenchmark on all the browsers i have access to on my computer and phone and safari was about 10 times faster than chrome and firefox. i tried setting `PAGE_SIZE` to `Infinity` to get back original "load everything all at once" behavior to see if that translated to actual perceived performance, and yeah, it worked _way_ better than all the other browsers i tried.

## filtering using css selector makes pagination easy
the tags filter works like this: each item has a e.g. `data-tags="[doom] [metal] [saxophone]"` and  on the filter we got an `input` event listener: 

```js
// where `style` is an existing `<style>` element
input.addEventListener("input", (e) => {
    const value = e.target.value.trim();
    
    if (!value) {
      style.textContent = "";
      return;
    }
    
    const selector = value
      .split(/\s+/)
      .map((s) => `[data-tags*="${s.trim()}"]`)
      .join("");

    const css = `.item:not(${selector}) { display:none; }`;
    style.textContent = css;
});
```

so typing [`doom saxophone`](/bsky-bc?tags=doom+saxophone)[^2] creates a selector that hides everything that doesn't match both `doom` and `saxphone`:

```css
.item:not([data-tags*="doom"][data-tags*="saxophone"]) { display:none; }
```

i did it this way mostly because i'd never tried it before, wanted to see if it would work, and it did! i'd usually do this by manually looping over elements and modifying style/class.

css selector approach lets the browser keep track of individual element state, which means this just works™ with elements that get added to the DOM without needing to manually keep track of applying state to new elements.

## updating `window.history` state causes `<datalist>` autocomplete to close

while i was mucking around in there i figured i'd also filters to the window location so the state is maintained after refreshing. also makes it easier to grab links to pass around.

```js
function setQueryParam(key, value) {
  const url = new URL(window.location);
  if (!value) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  window.history.replaceState(null, "", url.toString());
}
```

most straightforward thing i tried was adding `setQueryParam("tags", value)` to the `input` event handler so i'd get per-keystroke updates[^3], but that didn't work out for an unexpected reason: the autocomplete provided by `<datalist>` closes! 

this leads to a lot of flashing ui while typing. debouncing doesn't totally fix the problem: even if i wait and only update at the end of typing, `replaceState` closes the autocomplete at _that_ point, which breaks the flow of typing a prefix and looking at the filtered autocomplete since it closes while i'm trying to look at the results.

i tried a bunch of stuff, and the least bad thing i found was to stick the call in the `blur` handler instead. i still don't love this because not all browsers handle focusing the location bar as I would expect.

- **arc**: opening the location switcher does not blur the element, but _closing_ the switcher blurs the element before refocusing it 🤷🏽.
- **firefox (desktop)**: clicking the location bar works as expected, but using `cmd+l` does not—the new value gets added, but only _after_ the url is selected, so it ends up 
    - <mark>/bsky-bc?tags=old</mark>+new
- **firefox (mobile)**: works like desktop `cmd+l`; does not highlight the full url
- **chrome (desktop)**: works as expected
- **chrome (android)**: works like arc; does not blur until the location overlap is closed
- **safari**: works as expected

## important conclusion

`doom saxophone` fuckin _rules_

<!-- start embed -->
<iframe style="border: 0; width: 100%; height: 120px;" src="https://bandcamp.com/EmbeddedPlayer/album=1890505412/size=large/bgcol=333333/linkcol=0f91ff/tracklist=false/artwork=small/transparent=true/" seamless><a href="https://agoniarecords.bandcamp.com/album/apeiron">Apeiron by Five The Hierophant</a></iframe>
<!-- end embed -->


[^1]: or at least a good enough way
[^2]: didn't actually expect to find anything with this, but it did and i am _digging_ this record
[^3]: do not watch every keystroke if you are using `pushState`! you will spam the user's browser history and that is annoying!