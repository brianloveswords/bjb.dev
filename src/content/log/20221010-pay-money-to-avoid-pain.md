---
title: i spent $1.02 to avoid using docker
description: and i'd do it again
pubDate: 2022-10-10
---

I have an apple m1 macintosh personal computer and it's pretty nice, I run it in low power mode 100% of the time and the performance/battery life tradeoff is great.

overall I'm pretty happy with it, but the other night I was trying to do some stuff with a binary that was only compiled for linux x86 and I thought "oh I know I'll use docker" and then I had two problems.

I spent an hour and could not get that shit to work, and I was starting to lose track of the actual problem I was trying to solve so [I tweeted looking for advice](https://twitter.com/brianloveswords/status/1578532613329162241) on the fastest way to just rent a real linux VM to get this done.

Linode and Digital Ocean seemed like good bets so I signed up for both and compared. Digital Ocean ended up winning even though Linode was slightly cheaper because Linode forced me to answer 3 "security questions" in order to set up MFA, and it would not accept my password-manager generated answers because they were too long, but it only told me that after I tried to submit them. I also could not remove my credit card from my account, even though I had no live resources, and I didn't want to leave that in there without MFA enabled, so my only recourse was to close my account!

anyway once I had a DO account, I copied the stuff I was working on in my dockerfile, turned that into a bash script and spun up & destroyed VMs until it worked, then got on with what I was trying to do.

I left a VM up overnight, so it ended up costing me a bit more than it should have. I probably could have spent another hour or two fucking with docker until I figured out how to make it properly emulate x86, but instead I paid $1.02 to avoid using docker and actually solve the problem I was trying to solve.

Someone in the replies to my tweet said "why pay money for this when you could QEMU?". I've never used QEMU and it could probably solve the problem of getting an an x86 linux binary working on an m1 mac—but that's not the _actual_ problem I'm trying to solve. I just want to use this tool to do something and spending $1.02 to spin up some actual VMs is *way, way, incredibly* cheaper because I value my time.

## listening to

Jouska – visions from the bridge
<iframe style="border: 0; width: 350px; height: 350px;" src="https://bandcamp.com/EmbeddedPlayer/album=1903270892/size=large/bgcol=333333/linkcol=0f91ff/minimal=true/transparent=true/" seamless><a href="https://jouska.bandcamp.com/album/visions-from-the-bridge">visions from the bridge by Jouska</a></iframe>
