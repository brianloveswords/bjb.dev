---
title: thinking bout linting
description: linting is rad
pubDate: 2020-11-25
---
## What I’m listening to

[Demen — Nektyr](https://demen.bandcamp.com/album/nektyr)

<a href="https://demen.bandcamp.com/album/nektyr">
  <img
    src="/assets/demen-nektyr.jpg"
    alt="album cover: dark background with a few splotches of light abstract shapes. no words on the cover."
    style="width: 350px; height: auto"
  />
</a>

I saw a Bandcamp feature “[The Mysterious Demen Makes Music from a Deep Cavern in a Distant Past](https://daily.bandcamp.com/features/demen-nektyr-interview)” and there couldn’t be a description that sounded more up my alley.

Between that and [Kranky](https://kranky.bandcamp.com) putting it out, I smashed that buy button before the page finished loading. Kranky is one of two or three record labels who I’d buy a record from sound unheard, just by virtue they put it out.

Anyway, back to Demen. That description is spot on. This album makes my brain go places. There are parts that remind me of Bark Psychosis, but really this is it’s own thing, it’s not trying to be anything else. I mentioned earlier this week I was going for records I could write to, stuff that is fairl ambient and doesn’t pull focus. This fits that, even with lyrics it doesn’t demand attention—but it does warrant it.

## Linters for learning

I’m using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) to test as I develop this site. I think about it like a linter for end-user affecting website best practices. I’ve spent the last few years in data engineering, before that I was people managing, and before _that_ I was doing mostly API design, so it’s been exactly One Hot Minute since I’ve been the person directly hook for this stuff. Already I’m learning a lot!

For example I pulled in that font yesterday, and that brought me some new suggestions. First was using `<link rel="preload">` on the font files since they’re in the critical render path. Cool, I popped those in and immediately got some errors. Turns out for font files in particular, “[because of various reasons](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content#CORS-enabled_fetches)” the `crossorigin` attribute has to be set, even when it’s not a cross origin request!

(I took a [quick glance at the spec](https://drafts.csswg.org/css-fonts/#font-fetching-requirements) and I still didn’t really understand _why_)

Once I got that fixed, next suggestion to use [`font-display`](https://drafts.csswg.org/css-fonts/#font-display-desc) to prevent flash of invisible text. I’m glad this was suggested because `font-display` didn’t exist last time I was doing frontend development with custom fonts!

I’m not sure whether it’s really fair to call Lighthouse a linter, but nevertheless it’s helped refresh my web knowledge and point me to modern best practices.

Another tool that’s probalby more aligned with how folks traditionally think about with linting, and one I use all the time, is [`shellcheck`](https://github.com/koalaman/shellcheck). If you write a shell script that is more than a one-liner (and even then!) I highly recommend incorporating `shellcheck` into your workflow.

There are just _so_ many pitfalls to shell scripting. Here’s an example. I used to use `$*` to mean “give me all the arguments passed to this script”. Turns out that’s not a universally safe way to do that:

<img
  alt='screenshot of VS Code showing the code “echo $*” with an error below saying “Use "$@" (with quotes) to prevent whitespace problems'
  src="/assets/2020-11-25-shellcheck.jpg"
  style="width: 700px; height: auto"
/>

What kinda whitespace problems, though? Shellcheck provides a wiki with pages for every error with examples and rationale, so we can [look up SC2048](https://github.com/koalaman/shellcheck/wiki/SC2048) to see just what kinda issues this can cause! I’ve learned a ton about portable shell scripting by getting flagged by `shellcheck` and reading the related wiki pages for why the thing I thought was safe probably isn’t.

This section is really generalizable to _static analysis for learning_. I think about the Elm compiler as a pioneer in this area—check out “[Compilers as Assistants](https://elm-lang.org/news/compilers-as-assistants)” published back in 2015<sup>[[1](#fn1)]</sup>.

My desktop music player is something I threw together in Electron with an Elm frontend, and I’ve found Elm lovely to work with largely due to the excellent compiler messaging.

I look for insiration in these areas because part of my day job involves developing internal CLI tools, and one of my goals is making the human-readable output as informative and productive as possible when something doesn’t go quite right.

---
<a name="fn1"></a>

[1]: I haven’t tried too hard yet to find earlier examples of thinking about compilers in this way, particularly in the UX of messaging. If you know of any, [please feel free to let me know](https://twitter.com/brianloveswords), I’m interested in reading more about this!
