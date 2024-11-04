---
title: what I want in a static site generator
description: I want custom elements
pubDate: 2022-02-16
---
_Currently listening to: [LLNN — Unmaker](https://llnn.bandcamp.com/album/unmaker)_

My homegrown static-site generator does not have a feature I want so I ended up not posting at all last year: a tale as old as time. The thing I want is custom elements.

Custom elements are very well supported at this point for modern static site generators—pretty much all of them support using components/elements from some framework or other.

I considered switching away from my homegrown bullshit, I really did. The problem was, in 2020, none of the SSGs I looked at supported components _in the way I wanted_.

1. JavaScript in components should be a progressive enhancement, not a requirement, meaning that most things should compile to standard HTML and CSS. Many existing SSGs fail at this.
2. The component should be able to _make asynchronous calls to external processes to build itself at compile time_. This ruled out everything else I looked at.

## let's talk about that second requirement a little more.

Here's something I want to be able to do

```html
Pico sure does look like she's up to something.

<x-squoosh
  src="assets/pico.png"
  width=1200
  height=800
  alt="tabby cat named Pico perched on a floor-to-ceiling cat tree with a mischevious look in her eye"
>
  <x-source
    format="avif"
    quality=30
    effort=4
  />
  <x-source
    format="webp"
    quality=75
    effort=4
  />
  <x-source
    format="mozjpeg"
    quality=75
  />
</x-squoosh>
```

That element should generate something like this in the final output.

```html
<p>Pico sure does look like she's up to something</p>
<img
  width=1200
  height=800
  srcset="assets/pico.1200w.avif,assets/pico.1200w.webp"
  src="assets/pico.1200w.jpg"
  alt="tabby cat named Pico perched on a floor-to-ceiling cat tree with a mischevious look in her eye"
/>
```

...but more importantly, it should run the [squoosh CLI](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli) to *build the images* (only when necessary! Don't waste work building stuff that already exists!)

## but now it's the future

In 2020 nothing I looked at had what I wanted[^1], but it's 2022 now and I think [Astro](https://astro.build/) might fit the bill, or at least be close enough that it won't annoy me into writing my own thing again.

Not only has the landscape of SSGs changed, _I've_ changed, or at least my priorities have. When I put this dang site together in late 2020, my motivation was split between three (conflicting) priorities:

1. write more words
2. learn and practice Scala
3. update my knowledge about FE performance

At this point, I feel satisfied with `#3` and I get to satisfy `#2` pretty regularly at my day-job at this point, so I don't really need to incentivize myself to do it within the context of this site—especially since it's been blocking priority `#1`!

All that said, I haven't made the switch yet, so there's still plenty of opportunity for me to go "lol j/k see you in 2023".


[^1]: I wanted to make sure Astro didn't exist in 2020 so I [dug through the commit history](https://github.com/withastro/astro/commits/main?after=b238b8c2486af0165e88d947d57a909dd32bcdbd+2175&branch=main) and I love [this commit](https://github.com/withastro/astro/commit/47d1c22449cb2c3a236170382ae9e8210a711ee0) showing the pre-public name was `magicthing`.
