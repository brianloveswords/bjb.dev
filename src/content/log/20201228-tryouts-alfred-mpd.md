---
title: "tryouts: alfred and mpd"
description: trying some new things
pubDate: 2020-12-28
---
## Trying out Alfred

Yesterday I wrote about [automating default browser switching](/_/2020-12-27.html) and mentioned that I use LaunchBar mostly out of habit.

Since I’m interested in automating more stuff, I wanted to give [Alfred](https://www.alfredapp.com) a shot before I went all-in and made a bunch of LaunchBar actions that would be a pain in the ass to port later.

One problem out of the gate was that it didn’t play nice with one of my complex [Karabiner](https://karabiner-elements.pqrs.org/) modifications. I have it set up so when I tap Return, that inserts a `\n`, but when I _hold_ Return, that acts as the Control modifier.

This has always been a little janky and there are a bunch of applications that interact weird with this, enough that I have multiple Karabiner profiles set up so I can turn it off with a few clicks. With the modification turned on, Alfred wouldn’t actually _launch_ the things I was pressing Return on, it would always act as if I tapped Control.

Running commands is too fundamental to my workflow to have to fiddle around with switching keyboard profiles every time I want to do something. “Hold Return For Control”, we’ve had a good run together but this was the last straw. I switched my right option key to control instead so I still have a control key on the right side.

Maybe it’s obvious since I’ve spent 3 paragraphs talking about Control keys, but I’m a recovering Emacs user. I use VS Code now, but after over a decade and a half my brain is irreversibly poisoned to the point where I need to get as close to the right keybindings as possible, so I spend 85% of my waking hours holding down a Control key and my pinkies are gonna fall clean off my body sometime in the next few years.

Anyway with Alfred actually doing the main thing it’s designed to do, the next thing I needed to fix was fuzzy matching. I’m used to being able to type, for example, `ff` for Firefox. Out of the box, Alfred’s fuzzy matching is more strict and requires consecutive matching until either space or capital—if it was “FireFox”, `ff` would work, but since it’s not it doesn’t.

Fortunately there’s an option for that! Changing the option from “fuzzy capital letters” to “fuzzy match from word boundary” solved the issue. Before I found that option I’d started making some simple workflows for each alias I needed.

<center>
  <img
    alt="screenshot showing switching the fuzzy match preference"
    src=/assets/2020-12-28-fuzzy-match.jpg
    style="max-height: 212px">
</center>

Making workflows in Alfred is a bit more clicking than I might like, but otherwise it’s dead simple.

### Aside: I’m working on a music player

I’m casually working on a music player and I’ve been meaning to experiment with [`MPD`](https://www.musicpd.org/) to use as a backend. It’s a client/server model music player, so you start up the daemon and can connect different clients do it.

What I have prototyped so far is an electron app and for audio playing I’m doing the simplest thing I could think of, which is dynamically jamming things into an `<audio>` tag. It _pretty much_ works (and I get media key support for free!) but there are a few things that are starting to annoy me.

1) I’m either doing something wrong, `<audio>` tags don’t get the CPU priority I’d hope because I get hiccups occasionally. Not terrible, once every few albums, but still annoying.

2) Gapless playback isn’t possible with the `<audio>` tag alone. It is _possible_ with Web Audio API, but not particularly straightforward for all codecs.

The things I want to experiment with most are UIs and music metadata; I kinda don’t want to fuck around with how I get the wiggly air to come out of my headphones. MPD seems like a real solid option.

### Making an MPD interface out of Alfred workflows

There’s a reference command line app for controlling MPD called `mpc`. It maps pretty closely to the MPD TCP protocol, `mpc <command> <options>`, and the output is easy to parse when necessary, so I figured to test both Alfred workflows and MPD, I could write a handful of shell scripts and create an interface of sorts for playing albums.

<center>
  <img
    alt="screenshot showing switching the fuzzy match preference"
    src=/assets/2020-12-28-alfred-workflow.jpg
    style="max-height: 621px">
</center>

Most of those shell scripts are one-line proxies to the relevant `mpc` command, but some of them require a few more steps. Here’s `mpc-play-album`:

```bash
#!/usr/bin/env bash
set -eux

# Alfred doesn’t seem to respect my default shell exports so we have to set this manually
PATH=/usr/local/bin:${PATH}

query=$1

mpc stop
mpc update --wait
mpc clear
mpc add "${query}"
mpc play
```

MPD doesn’t watch directories for changes, so it has to be told when to `update` the local database. I don’t want to ever have to actually remember to do this when I buy new records, so I made it part of the play command. `update` is incremental so it’s fairly quick, less than a second.

I organize my music in a 1-layer folder hierarchy (`<artist> - album>/<songs>`) so I have the Alfred `play` keyword set up to scan the list of folders in my music directory, then it pipes whatever selection I make to a utility action that strips off the leading filesystem prefix (~/Dropbox/Music/) so it can be passed directly to `mpc add`.

<center>
  <img
    alt="screenshot showing switching the fuzzy match preference"
    src=/assets/2020-12-28-play.jpg
    style="max-height: 340px">
</center>

Let’s look at one more action.

```bash
#!/usr/bin/env bash
set -eux

PATH=/usr/local/bin:${PATH}

if mpc status | grep -q -E "0:0(0|1|2)"; then
    mpc prev
else
    mpc seek 0
fi
```

This one is `mpc-previous`. Originally it was a straight proxy to `mpc prev`, but something felt off when I was using it. It took me a bit to realize it broke a convention I’ve grown used to: the action of ⏮ buttons on a lot of music players is state-dependent.

- If the song is in the middle of playing, it jumps back to the start of the song.
- If the song is at the start, it jumps back to the beginning of the previous track.

I decided “at the start” would mean within the first 3 seconds, so I hit `mpc status` and look for `0:00`, `0:01`, or `0:02` in the output.

```text
Autechre - Clipper
[playing] #2/10   0:11/8:34 (2%)
volume: 49%   repeat: off   random: off   single: off   consume: off
```

Once I made that change, using the `previous` action felt a lot more natural.

### Those keybindings are gnarly

All the actions in the workflow can be triggered by keyword commands as well as keyboard shortcuts that look absolutely stupid to press.

There’s this untapped layer of possibility hiding within `fn` key and I really wanted to take advantage of that. Unfortunately Alfred doesn’t let me bind things to `fn-<key>`. You know what does though? [BetterTouchTool](https://folivora.ai/).

I already use BetterTouchTool for a bunch of other things, including a lot of global key rebinds. I figured what I could do is set up those shortcuts that require clawing up my hand to press every modifier, which ensures I’d never hit them by accident or have them bound to something already, then use BTT to rebind `fn-<key>` to `Control+Option+Shift+Command+<key>`.

This worked out great: now I can hit `fn-j` to skip the current song or `fn-r` to load up a random album.

### I’m gonna stick with Alfred

The one other point that was make-or-break for me was clipboard history management and it works just fine. I’m just starting to mess around with auto-expanding snippets, but I’m not sure how useful they are gonna be yet. A lot of the area where I need snippets are context-dependent when programming and I already have VS Code snippets for that. I’ll try to keep my mind open for other potential uses I might be overlooking.

### I’m also gonna stick with MPD, at least for now

For now I’m happy to offload the actual “make sounds happen” part to MPD and focus on the music selection UI and UX. I do eventually want to have something that can stand alone without requiring folks to install and configure MPD because it’s definitely not straightforward for people who aren’t terminal savvy.
