---
title: initial commit
description: notes on setup
pubDate: 2020-11-21
---

- **Set this spot up**
  - _Infrastructure_
    - Google Domains
    - Google Cloud Storage
    - Cloudflare
  - _Deployment_
    - Makefile
    - trash static site generator I wrote in Scala to practice Scala.
    - `gsutil rsync -d -r <local> <remote>`
  - _Other Notes_
    - Everything static is real nice, but I wish I had some more control over
      routing. For example, I'd like bjb.dev/some/folder to serve the
      index.html without redirecting. I can probably do that with CloudFlare
      page rules, but then I gotta get on a paid plan.
      - Looks like page rules wouldn't actually do me any good, they are too
        expensive—it's basically $1/rule, probably because they are expensive
        to compute efficiently.
    - Right now I'm purging the entire cache when I deploy. That's fine for
      now because there's basically nothing here, but it's definitely
      wasteful. It would be good to figure out only what changed and just
      purge that. Theoretically I can get that from the `gsutil rsync` output?
