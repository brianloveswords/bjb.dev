---
title: keeping a personal archive
description: wayback machine for the stuff I read
pubDate: 2025-01-01
unlisted: false
---
## the internet rots

saving hyperlinks alone is insufficient. companies go under, pages die by [infocide](https://reagle.org/joseph/2012/05/draft-infocide.html), and while [cool URIs don't change](https://www.w3.org/Provider/Style/URI), not everyone has the knowledge or patience to `301 Moved Permanently` everything when they overhaul their information architecture or move domains. I want to have a copy of the content at the time I read it.

massive shoutout to [Internet Archive](https://archive.org/) for trying to solve this at internet scale. I wanted to solve this for myself at personal scale, because I don't want to depend on the Wayback Machine[^wayback].

[^wayback]: though now that I'm writing about it I might add saving the page to the Wayback Machine to my workflow!

## Zotero as my personal wayback machine

I mentioned Zotero in the past [talking about how I read papers](/log/20220226-how-i-read-papers), but I also I use it to archive much of what I read on the internet!

I have the [Zotero](https://www.zotero.org/) desktop app and [Zotero Connector](https://www.zotero.org/download/connectors) browser extension. I bound the browser extension hotkey to `⌥Z`. I don't archive _everything_ I read, but I err on the side of archiving if what I'm reading fires off enough of the good neurons.

when I started this endeavor I only archived research materials for work but after a while I expanded to anything at all that interests me—music reviews, good bluesky posts[^pin], interesting libraries for personal projects, etc.

[^pin]: I cannot bring myself to reply with 📌

I try to clean up the metadata at the moment I'm saving but sometimes I miss things, so I'll go back once a month or so and clean things up. also works as a new little review of things I was interested in!

## date-based organization

at the start I had everything in one big pile in My Library, but that got unwieldy after a few months. I decided to organize based on when I read the thing which has worked great for my brain. it prevents any decision paralysis about where to put something, and chronological recollection works for me when search is failing—I can usually recall other things I was reading or interested in at the time, jump to that point and find what I'm looking for from there.

the "find something close enough" method of navigation was inspired by `Item 4: Use incremental search for Navigation` from [effective-emacs](https://sites.google.com/site/steveyegge2/effective-emacs).

> To do it effectively, you don't necessarily need to search for the exact word where you want to put the cursor. Let your eye defocus slightly and take in the whole paragraph or region around the target point, and choose a word that looks reasonably unique or easy to type. Then i-search for it to navigate to it. You may need to hit Ctrl-r or Ctrl-s repeatedly if your anchor word turns out not to be unique. But Emacs will highlight all the matches, so if there are more than a couple of them, Ctrl-g out of the search and choose another anchor word.

I don't use emacs anymore[^emacs], but I still use variations of this technique all over the place in how I use computers and information retrieval in general.

[^emacs]: I miss emacs[^vim], particularly [org-mode](https://orgmode.org/) and [magit](https://magit.vc/), but also _editing with macros!_ I used ad-hoc macros **all the time**. 

[^vim]: I'm the rare person who was proficient with vim first and then switched to emacs later because I worked in a bioinformatics lab where everyone else was an emacs user and they were all sharing tips and I felt left out[^vscode]. that was where I first read effective-emacs about 20 years ago, and it's stuck with me since.

[^vscode]: this is also why I ended up switching to VS Code, but kinda in reverse. I wrote a `bigquery-mode` for emacs in ~2018 that provided me completions and all sorts of goodies that I could not share with my co-workers because straight up everyone else I worked with used VS Code. this was not the first time this happened, so I gave up and switched to VS Code[^zed] so I could write useful extensions that I could share with my coworkers, even though it was a far inferior editing experience. _you're welcome, old coworkers_.

[^zed]: I've been using [Zed](https://zed.dev/) for the past year or so mainly because it's much snappier and multibuffers absolutely rule, and my day-to-day job isn't programming computers anymore so I don't worry as much about sharing my setup with others. the text editing experience is still meh, but I've come to terms with the fact nothing will match my experience when I was fully emacs-pilled.
## syncing

I was more than happy to toss Zotero some money for a few years, but eventually I was paying for their highest tier and, since there's a self-hosting path, I figured I could reclaim that money to support worker-owned media like [Hell Gate](https://hellgatenyc.com/), [Aftermath](https://aftermath.site/?p=9598), and [Hearing Things](https://www.hearingthings.co/).

I already have a [Synology NAS](https://www.synology.com/en-us) to use as sync destination, and a private network to access my NAS when not on LAN via my free personal [Tailscale](https://tailscale.com/) account.

it's straightforward to getting this all working:

1. install the Synology WebDAV package
    - you can use HTTP, Tailscale traffic is already end-to-end encrypted
2. install the Synology Tailscale package
3. adjust `Sync > File Syncing` settings in Zotero 
4. that's it

If I had a hobby box instead of a real NAS, I'd probably look into using [Taildrive](https://tailscale.com/kb/1369/taildrive) as my WebDAV server. honestly after reading [Remembering the LAN](https://tailscale.com/blog/remembering-the-lan) by Tailscale co-founder David Crawshaw, I'm fully down with what they're up to.

## what about mobile?

yeah this is a bit annoying. the Zotero Connector only works on desktop, and I do a lot of reading on mobile, so it's a bit roundabout to making sure to archive those, and I'm changing the way I do it. currently I have an `#inbox` heading in my daily notes and drop links under there with hopes & dreams that I triage them eventually. 

turns out that's not working so well for me! writing this is making me go through this backlog for the first time in two months and I have just over 500 links that I haven't triaged yet.

some of these are already in the archive because I stumbled on them again in a desktop browser, and many of them won't make it to the archive at all because while I'm pretty open to what I archive, I'm wildly indiscriminate with what I toss into the inbox, but that's too many untriaged links.

I don't have a better system in mind yet; if I come up with one I'll post about it.

## current listening

<!-- embed start -->
<iframe style="border: 0; width: 400px; height: 274px;" src="https://bandcamp.com/EmbeddedPlayer/album=109050306/size=large/bgcol=333333/linkcol=9a64ff/artwork=small/transparent=true/" seamless><a href="https://darkdescentrecords.bandcamp.com/album/sparagmos">Sparagmos by Spectral Voice</a></iframe>
<!-- embed end -->