---
title: cats, todo, and parsing
description: adopt my cats
pubDate: 2020-11-22
---

## What I’m listening to
[Nothing - The Great Dismal](https://nothing.bandcamp.com/album/the-great-dismal)

I got into Nothing because of the [Relapse Sampler 2019](https://relapsesampler.bandcamp.com/album/relapse-sampler-2019). They have a cover of Heavy Water/I’d Rather Be Sleeping by Grouper, from the album [Dragging a Dead Deer Up A Hill](https://grouper.bandcamp.com/album/dragging-a-dead-deer) which is also excellent. That cover caught my ear and made me look for more of their stuff.

Turns out they are great, even if the album cover for [their last album](https://nothing.bandcamp.com/album/dance-on-the-blacktop) freaks me out.

## Vera up for adoption
She’s up on petfinder.com <em>edit 2022-10-07: link is now dead</em>

## Ziggy going up soon
I find writing cat bios very difficult.

I have no idea how to describe a cat in a way that makes people want to adopt. And there’s no way to get feedback—I can’t ask people who respond to the ad like “hey what was it about that cat bio that made you interested?”

Without that feedback loop, I have no idea if I’m actually doing a good job or if people are just going by the fact that some cats are cuter than others and I could write “it’s a cat wtf else do you want?”

## Scheduling instead of TODO lists?
I skimmed an article (on my phone, while lying in bed and I cant find the link now) that had a general thesis of “todo lists are trash and distracting, instead you should schedule your time”.

There are two things my broken brain relates this to:

- **OKRs**: instead of saying “I’m gonna get these things done”, set objectives.
- **Budgeting**: [Give every dollar a job](https://www.youneedabudget.com/budgeting-tip-give-every-dollar-a-j-o-b/)[^1] but instead of dollars, “give every block of time” a job.

[^1]: At this point I’m giving [Actual Budget](https://actualbudget.com/) a shot as my budgeting software, but I have YNAB to thank for teaching me how to budget in a way that works. I can’t recommend their methodology enough.


## <a name="parsers">Get source code colorization working</a>
_update 2022-02-17: this isn't how stuff works anymore, but I'm leaving it here for sake of historical accuracy_

- working on site generator, I’m gonna eventually wanna include some code in my logs/posts
- use [pygments](https://pygments.org/)?
- let’s color this block of code
  ```scala
  final class MLock(mvar: MVar[Task, Unit]) {
    def acquire: Task[Unit] =
      mvar.take

    def release: Task[Unit] =
      mvar.put(())

    def greenLight[A](fa: Task[A]): Task[A] =
      for {
        _ <- acquire
        a <- fa.doOnCancel(release)
        _ <- release
      } yield a
  }

  object MLock {
    def apply(): Task[MLock] =
      MVar[Task].of(()).map(v => new MLock(v))
  }
  ```


### How I did it

Suboptimally!

I’m using [commonmark-java](https://github.com/atlassian/commonmark-java) so I could write an extension to handle this. That’d probably give the best performance.

But I don’t want to write a commonmark-java extension, I want to [<strike>turn people into dinosaurs</strike>](https://www.jwz.org/blog/2015/01/but-i-dont-want-to-cure-cancer-i-want-to-turn-people-into-dinosaurs/) write [FastParse](https://github.com/com-lihaoyi/fastparse) parsers.

Why? Because

1. I generally enjoy writing parsers more than I enjoy writing a bunch of Java factory stuff.
2. More practice. I’m going to eventually replace some [PEG.js](https://pegjs.org/online) generated parsers and given my generally excellent experience using stuff written by [Li Haoyi](https://www.lihaoyi.com/) I’m leaning towards using FastParse.


So instead of writing an extension, I wrote a parser that extracts any fenced code block, runs it through `pygmentize` and replaces the fenced block with output. Since markdown is a superset of HTML, I figured this would work just fine.

And it _kinda_ did. But the indentation wasn’t quite right. Turns out `commonmark-java` doesn’t do a great job of maintaining whitespace of `<pre>` blocks that have a lot of tags in them. _Bummer_.

So what I did next was use the same parser but instead of replacing with `pygmentize` output, I replace with a construct that `commonmark` won’t mess up (`[[{{<language>:<base64(body)>}}]]`) and put _that_ back into the markdown. Then I render the markdown, and use another parser that extracts that construct and replaces it with the `pygmentize` output.

And that _mostly_ worked! There was one more small problem: it was respecting whitespace but it was respecting _all the whitespace_—including the margin.

![screenshot of code block above showing there are 4 spaces of indentation in front of every line](/assets/2020-11-22-code-screenshot.jpg)

Notice how there’s indentation before every line of the code block? I don’t want that in the final output, I want the margin stripped. Unfortunately Scala’s `stripMargin` doesn’t really help here because it requires the margin to be pre-annotated with leading pipes `|`.

Welp, I guess I’ll just write my own!

```scala
def dedent(input: String): String = {
  val trimNewlines = raw"^\n+".r.replaceFirstIn(input, "")
  if (trimNewlines.charAt(0) != ' ') return trimNewlines
  val out = raw" +".r.replaceFirstIn(trimNewlines, "")
  val level = input.size - out.size
  if (level == 0) return out
  val replacer = ("\n" + (" " * level)).r
  replacer.replaceAllIn(out, "\n")
}
```

This not my favorite code, but whatever it works.

### Performance?

If I wrote a `commonmark-java` extension, I’d be able to get away with a single pass. Since I’m doing this wacky pre/post processing business, each markdown file gets _three_ passes. Does that actually matter in practice? Are the performance police going to come take away my computer card?

Nah not really. This is for a command line static site generator, not a hot code path in a web server getting 1000s of hits a second. I’m not gonna fire myself if I spend a few extra milliseconds (if that) per markdown file the 1 or 2 times a day I generate this site!
