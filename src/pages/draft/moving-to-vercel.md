---
layout: ../../layouts/BlogPost.astro
title: migrating from cloudflare to vercel
description: 👋🏽 cloudflare
publishDate: draft
version: 1
---

- want a website where if something i write or make on it becomes popular I do
  not run the risk of paying thousands of dollars
- i also want to run a website that does not require me to to provide data or
  money to companies that support/protect white nationalists and terrorists.
- prior to this post, I was using Google Cloud Storage and Cloudflare but GCS
  fails the first point and Cloudflare fails the second.
- vercel provides DDoS protection and the hobby tier is free. all of the
  limits are well within anything I want to be able to do with this site.
- my site is now in Astro and there's good instructions for that
- biggest risk/unknown is SSL. currently Cloudflare manages my SSL, which was
  a mistake. I'll probably make the same mistake moving to Vercel and let them
  manage my keys.
