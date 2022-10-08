---
layout: ../../layouts/BlogPost.astro
title: unison and source formatting
description: text vs structured is the new tabs vs spaces
publishDate: draft
version: 1
---

- [Unison](https://www.unison-lang.org/) is really exciting.
- doing new stuff
- unafraid to break with history
- want to talk about this in particular:
  > Other tools try to recover structure from text; Unison stores code in a database. This eliminates builds, provides for instant nonbreaking renames, type-based search, and lots more.
- programmers (except lisp) tend to think of code as text
  - canonical form of source code is _text_, usually utf8 encoded
  - structural editing tho
- folks like `gofmt` because there's no argument about how source gets formatted
  - similar with `prettier`, but it just moves the fight from mergetime to just once, ahead-of-time
- tabs vs spaces: tabs for indentation is absolutely superior
  - [it's an accessibility issue](https://adamtuttle.codes/blog/2021/tabs-vs-spaces-its-an-accessibility-issue/)
  - allows configurability: if you like 2 visual spaces, and I like 4, we can both get our way
- what if we had that configurability for everything?
- this is unlocked if we don't store code as text and the *canonical* form of source is structured
- a smart editor could then format the code however, and accept valid code in any format, without merge conflict
- of course this breaks a lot of things: standard diffing tools no longer work since they look for differences in the actual bytes, not the structured form of the code.
