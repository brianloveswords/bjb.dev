---
title: automating default browser switching; ugly images redux
description: wish i could open different urls in different browsers
pubDate: 2020-12-27
---
## Automating default browser switching

A few days ago I picked up [Hillel Wayne](https://www.hillelwayne.com/)’s collection of newsletters, [Computer Things 2019-2020](https://leanpub.com/computerthings2020/). I subscribe to the newsletter and read a lot of the content already, but it’s great to have a collected PDF version I can read and annotate in [LiquidText](https://www.liquidtext.net/).

One of the drafts from the newsletter that turned into a post is about everyday workflow automation, [In Praise of AutoHotKey](https://www.hillelwayne.com/post/ahk/). This inspired me to fix something in my everyday workflow that is more annoying than it should be.

I use Chrome for work and Firefox for everything else. During the work day, most of the links I click are gonna be work stuff, so I want that to open in Chrome. Outside of working hours, I want links opened in Firefox.

I’m on macOS and [LaunchBar](https://obdev.at/products/launchbar/index.html) is my preferred command-palette and figured I could write an action if I could find a UI-less way to change the default browser.

I searched for “change default browser commandline macos” which led to [StackOverflow](https://stackoverflow.com/questions/17528688/set-default-web-browser-via-command-line), which pointed to a CLI called [defaultbrowser](https://github.com/kerma/defaultbrowser), which is exactly what I need; even better, someone already added it to homebrew so I could `brew install defaultbrowser`.

Aside: I love that top answer from 2018 says, “I found this tool” when the first comment on the question, from 2014, is “I built something quickly” and it’s the tool that other person found.

Anyway, now I can go `Cmd+Space db ⏎ firefox ⏎` (where “db” is a trained shortcut for “Default Browser”). Before I just lived with links opening in the wrong place and moving them over manually every time using `Cmd+L Cmd+X Cmd+W Cmd+Tab Cmd+T Cmd+V ⏎`

Breaking that down:

- `Cmd+L`: focus the location bar and select everything in it
- `Cmd+X`: cut
- `Cmd+W`: close tab
- `Cmd+Tab`: switch application (until I find Firefox)
- `Cmd+T`: open new tab
- `Cmd+V`: paste URL
- `⏎`: Go

### Why LaunchBar? I don’t know.

I’m trying to remember what made me choose LaunchBar. I’ve used some kind of keyboard-driven command launcher for as long as I can remember—back in the year of Linux on the desktop, I used Katapult and when I switched to OSX I used Quicksilver. I think I upgraded OS versions and something didn’t work, so I switched to LaunchBar and just stuck with it since.

Writing this up is making me think about giving Alfred a shot, though. One of the things that was keeping me on LaunchBar was clipboard history and it looks like Alfred [added that in 2016](https://www.alfredapp.com/changelog/v3/). Autoexpanding snippets also seem nice, and a blessed path for preference syncing using Dropbox.

## Ugly images redux

[I previously talked about keeping images ugly](/_/2020-11-23.html) and mentioned that I considered automating image compression but decided against it because visually inspecting is the only way to know I’m right above unacceptable.

WELP turns out there’s an algorithm for that™! I saw this blog post about the [Squoosh v2](https://web.dev/squoosh-v2/) release (by Mariko, one of my BrooklynJS co-conspirators back from when we could pack 100 people into small rooms lolsob) and it has this line:

> The CLI also offers auto compression, where it tries to reduce the quality of an image as much as possible without degrading the visual fidelity (using the [Butteraugli metric](https://github.com/google/butteraugli)).

I should have guessed there was something like this. On the other hand I’m glad I didn’t because now I can just use the squoosh v2 CLI instead of trying to incorporate it on my own.

I’m also glad to have the words “psychovisual difference” in my vocabularity so I can read more about this field! Already I’ve found this article that looks interesting from Cloudinary, [Detecting the psychovisual impact of compression related artifacts using SSIMULACRA](https://cloudinary.com/blog/detecting_the_psychovisual_impact_of_compression_related_artifacts_using_ssimulacra).
