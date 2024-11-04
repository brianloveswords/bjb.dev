---
title: procs is a neat ps replacement
description: ps -aux? wait that's not right
pubDate: 2022-10-08
---

I do a lotta dumb things with computers so I need to kill processes a lot. I'm pretty lazy so I usually `pkill java` or `node` or whatever, but this is annoying when I break language servers and other things using the same runtime.

I'd rather `kill` exactly the process I need to but I can never remember how to use `ps` to do what I want—it's not consistent between linux and macOS, and now I'm using [nushell](https://www.nushell.sh/) and that has it's _own_, different `ps`.

[`procs`](https://github.com/dalance/procs) is a replacement for `ps` and I can remember the options for it much easier: `procs --sortd tty` shows me all the proceses sorted in descending order by what TTY they are attached to. It opens in a pager by default so I can page around and find what I'm looking for.

[`btm`](https://github.com/ClementTsang/bottom) is another tool that lets me see processes except it's a `top` replacement (and more). I can kill processes directly from `btm`, but it's not as easy for me to find the process I'm trying to kill since I can't sort by TTY.

## listening to
Chat Pile - God's Country
<iframe style="border: 0; width: 300px; height: 300px;" src="https://bandcamp.com/EmbeddedPlayer/album=1845795607/size=large/bgcol=333333/linkcol=0f91ff/minimal=true/transparent=true/" seamless><a href="https://chatpile.bandcamp.com/album/gods-country">God&#39;s Country by Chat Pile</a></iframe>
