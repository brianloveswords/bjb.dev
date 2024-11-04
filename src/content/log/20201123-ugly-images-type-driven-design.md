---
title: ugly images and type driven design
description: I'm not a designer and I don't play one on TV
pubDate: 2020-11-23
---
## What I’m listening to

[Steve Roach — TOMORROW](https://steveroach.bandcamp.com/album/tomorrow)

<a href="https://demen.bandcamp.com/album/nektyr">
  <img
    src="/assets/steve-roach-tomorrow.jpg"
    alt="cover of tomorrow, a pastel painted desert landscape"
    style="width: 350px; height: auto"
  />
</a>

Rhythmic ambient, great “let’s ease into this week” music. When I’m programming I can listen to pretty much anything and not have it take focus, but I’m doing a lot of writing at work this week.

I don’t get into the flow of writing as easily as programming these days so I’m more particular about the music I listen to; I need something that goes down smooth but also don’t pull attention. This rules out music with lyrics in a language I can understand.

I found out about this album from a Bandcamp newsletter. I’ve built enough of a collection that their recommendations are getting pretty good, and they recommended this a few weeks ago tagged with the label “drone”.

Aside: [Cryo Chamber](https://www.cryochamberlabel.com/) is a record label focused on dark ambient and everything they put out is right up my alley. I’ve got a stack of records in my queue from them I’m looking forward to getting next Bandcamp friday, top of the list being [Advent by Randal Collier-Ford](https://cryochamber.bandcamp.com/album/advent)

## Keeping images one notch above ugly

Jake Archibald [wrote a great piece about AVIF](https://jakearchibald.com/2020/avif-has-landed/) and one line in there has stuck with me:

> If a user looks at the image in the context of the page, and it strikes them as ugly due to compression, then that level of compression is not acceptable. But, one tiny notch above that boundary is fine.

I’m trying to keep payloads as small as possible for this site. I’m motivated by economics: I don’t make any money from this content, and I am on the hook for outgoing bandwidth, but also there could be folks reading this metered network connections who are paying for the bytes I’m sending them. Not that I’m particularly mobile at the moment (thanks 2020), but my mobile data plan is metered and I get annoyed when I visit sites that send huge images for no good reason.

### C’mon, Apple!

Jake’s post got me jazzed up about AVIF, but as expected it’s [not well supported yet](https://caniuse.com/avif). Alright, fine, but WebP is pretty good too, how about defaulting my images to that?

Turns out, nope, desktop Safari only supports it on Big Sur!

### But what about the &lt;picture&gt; element?

Yeah, that’s probably what I’m going to do going forward. I was hoping I could get away with just using one format because these posts are composed in Markdown and it’s nice be able to use `![alt](path)`, which translates to a straight up `<img>` element and does not support multiple sources.

I already have [some preprocessing to deal with code blocks](/log/20201122-cats-todo-and-parsing/#parsers), so I’m considering tacking on another parser to do some fancy stuff with multiple image sourcing.

Once my brain gets rolling on this stuff I have to be careful to reign it in—the very next thing I thought was “if I’m gonna write a parser to work with image references, why not make something that does WebP and AVIF encoding automatically from a source image referenced in the markdown!” but no, stop it brain that’s a bad idea.

Why that’s a bad idea goes back to the `<h2>` at the top of this section. Having an automated pipeline for image compression would be benefit for developer experience but _a worse experience for my readers_ because there’s no way for me to know if I’m nailing the “one notch” measurement, which means either sending larger payloads than strictly necessary, or images that so compressed they offend the senses. When I manually compress images using something like [squoosh.app](https://squoosh.app), there is a tight visual feedback loop for me to push an image to the point where it’s looking too rough, then pull it back _one notch_.

## Placeholders in type driven design

I was reading “[What’s in a rainbow table](https://fasterthanli.me/articles/whats-in-a-rainbow-table)” by Amos and saw he was using the [Rust `todo!` macro](https://doc.rust-lang.org/std/macro.todo.html) and it reminded me I had some thoughts about these types of placeholders. Eventually I might want to write a _whole post_ about it, but in the meantime I’ll get down some thoughts!

I love [`todo!`](https://doc.rust-lang.org/std/macro.todo.html) in Rust, [`???`](https://github.com/scala/scala/blob/v2.13.4/src/library/scala/Predef.scala#L341-L345) in Scala, [`undefined`](https://wiki.haskell.org/Undefined) in Haskell—things that return the [bottom type](https://en.wikipedia.org/wiki/Bottom_type) of the type system and blow up at runtime but otherwise make the typecheck happy so you can _model_ how your program fits together without _implementing_ stuff. In languages that don’t have one these predefined, like TypeScript, I’d find myself making one and using it all over the place while designing:

```typescript
const unimplemented = (name: string): never => {
  throw new Error(`${name}: needs implementation`)
}
```

Aside: It’s a bummer those `{ }` are necessary, but `throw` is a statement so it can’t appear alone as the body of an arrow function! [There was a proposal for `throw` expressions](https://github.com/tc39/proposal-throw-expressions) but it looks like it’s stuck in [stage 2](https://github.com/tc39/proposals#stage-2) and hasn’t been presented to TC39 since [January 2018](https://github.com/tc39/notes/blob/master/meetings/2018-01/jan-24.md#13iiii-throw-expressions-for-stage-3).

For an interesting read, [check out this old thread of Martin Odersky propsing adding ??? to Scala’s Predef](https://www.scala-lang.org/old/node/11113.html). It was a lot more controversial than I expected! Some people straight up oppposed to including it in Predef, but a lot of people voting for `TODO` as the name instead. I don’t mind `???` but would have liked an optional name parameter, like `todo!` has, so I don’t have to dissect the Java stack figure out where it’s coming from. Of course, I can always write my own! Maybe `??!("fn")`.

Also some of the commenters were right: search engines really don’t know what you’re going for when you search “scala ???”.
