---
title: automating low res screenshots
description: one thing that worked and six or seven that didn't
pubDate: 2025-01-29
image: /static/20250129/2025-01-29_final-workflow.28be359caf4ac86196cf49f4769828fa.webp
---


for the past 350 years i have been sitting through vendors pitching software that will [definitely solve 100% of all of my problems](https://matduggan.com/stop-trying-to-schedule-a-call-with-me/). i take a lot of screenshots and paste those into obsidian to have reference points for my notes.

as i've hoarded piles of powerpoint screenshots, something has started bothering me[^ai]: each screenshot is at least 1 MB because macOS thinks i would appreciate a pixel-perfect lossless representation of a vendor's feature matrix compared to their vastly inferior competitor who they know we'll be meeting with in an hour.

[^ai]: other than every vendor feeling like they need to shoehorn AI into their tools and presentation 😒

in this case, and in most cases, i do not need lossless pngs! i'm perfectly happy with lower resolution compressed garbage. perfect fidelity is the exception for me.

i picked up [Retrobatch](https://flyingmeat.com/retrobatch/) and [Acorn](https://flyingmeat.com/acorn/) a earlier this month after reading a [blog post](https://leancrew.com/all-this/2025/01/cleanshot-x-and-retrobatch/) talking about them and i appreciated being able to pay a reasonable price one-time to permanently own software made by an independent developer. i hadn't really used Retrobatch yet but this problem seemed like the ideal job for it!

it took a lot of fiddling, but i have a workflow that works great:

1. take a screenshot
2. `cmd+space` to open [Raycast](https://www.raycast.com/)
3. `lrc <enter>` to launch the `LowRes Clipboard.app` droplet made from Retrobatch
4. paste a scaled down 75% quality webp[^avif] instead of a lossless png

[^avif]: why not avif? beyond having to do extra work to make the "image hasn't loaded yet" experience good that i talked about in a prior post, i'm running into a bunch of things that do not support avif! for example my rss client [inoreader](https://www.inoreader.com/) will pick up the first image from a post to use as a preview for the post, but it doesn't work for avif. i'm gonna keep filing issues where i find gaps in avif support, but it might be a _little_ too early to go all in.

## what eventually worked

we'll come back to all the failed attempts, but let's start with what ended up working

<img loading=lazy src="/static/20250129/2025-01-29_final-workflow.28be359caf4ac86196cf49f4769828fa.webp" width="1000" height="586" style="background: #2D2E34;">

the workflow relies on two scripts, `timestamp-file` and `pbfile` that i'll put in the appendix at the bottom of this post. the first script renames files to have an RFC3339ish timestamp prefixed[^timestamp], and the latter is a wrapper around `osascript` to stick a file on the clipboard. 

the distinction between _a file_ and _image data from a file_ is important in this case. sticking image data on the clipboard _did not work at all for me_!

[^timestamp]: at some point I need to write about how I love to timestamp _everything_ and how it improves my quality of life by at least 18%<sup style="opacity: 0.5">[citation needed]</sup>

the `copy the file` method has another benefit i didn't immediately realize: it's a context-aware paste! if i paste into a program that accepts image data, the image data is pasted. otherwise, the file path is pasted. i've found this useful!

## failed attempt #1: pure clip->clip workflow, no intermediate files

what i initially wanted was to go straight from image data on the clipboard to transformed image data on the clipboard with no intermediate files. i tried connecting a `read clipboard` node to a `write clipboard` node.

<img loading=lazy src="/static/20250129/2025-01-29_clip-to-clip.37097a23acef6685929c745e36c11882.webp" width="642" height="330" style="background: #313339;">

this does not work because writing to clipboard doesn't allow for transformations. this is a bummer! but having spent some a little time fucking around in ObjectiveC (spoiler alert), i might understand why.

## failed attempt #2: clip->file->native clip (no scripts)

fine i'll use an intermediate file.

<img loading=lazy src="/static/20250129/2025-01-29_clip-file-clip.364d22971d9eee6d5a6e84788411e825.webp" width="958" height="320" style="background: #313339;">

this didn't work either. Raycast clipboard history lets me see the size of what's on my clipboard[^history].

<img loading=lazy src="/static/20250129/2025-01-29_history.ac5a2d39cc2005d61bbf14cf4c0cb7fc.webp" width="926" height="728" style="background: #292A2E;">

126 KB is too many kilobytes. i have the file, it's 14 KB. i guessed it might be converting to png, and yeah, if i paste into obsidian i'm getting a `.png`, and the `file` command agrees.

[^history]: huge shoutout to clipboard history tools, couldn't computer without 'em. if you're not using a clipboard history tool, get one _today_ to improve your quality of life by 18%<sup style="opacity:0.5">[citation needed]</sup>

## failed attempt #3: clip -> file -> pbcopy

`pbcopy` does not play nice with binary data. it pretends to work, but it does a conversion which i do not want. the `man` page is explicit about this:

> The input is placed in the pasteboard as plain text data unless it begins with the Encapsulated PostScript (EPS) file header or the Rich Text Format (RTF) file header, in which case it is placed in the pasteboard as one of those data types

also, lemme just say _love_ the output of `pbcopy -help`

```bash
; pbcopy -help
2025-01-29 17:29:42.920 pbcopy[89866:22467314] Usage: pbcopy [-help]

# that's it, that's the full output
```

🆒 very helpful.

## failed attempt #4: clip -> file with "overwrite original" set

yeah Retrobatch really doesn't like it when you use "Write back to original images" when using Clipboard as a source, it straight up crashes. i filed my crash report with them, we'll see what comes of it.

### update: they got back to me!

as i was drafting this post they emailed me back thanking me for the crash report, saying they investigated, fixed the bug, and built a new version which they linked me to!

i deeply appreciate the fast response—i filed the report just a few hours ago, and i'm frankly used to never hearing back when i file issues with software vendors so i didn't expect anything. big shoutout to [flying meat](https://flyingmeat.com/)!

## failed attempt #5: some loose ObjC i found jangling around on the internet

i found [this gist](https://gist.github.com/mwender/49609a18be41b45b2ae4) that folks in the comments said worked for them, so maybe it will work for me? only time will tell! 

foreshadowing: <em>this is under a header that says `failed attempt`</em>.

it works better than `pbcopy`, but it suffers the same problem as Retrobatch: it converts the image data to png, defeating the whole point of this cursed sidequest.

## failed attempt #6: plead with a robot to please make this loose ObjC i found jangling around on the internet do what i need and please double check your work no bugs please thank you!!

i barely know ObjectiveC—only ever had to modify it, never write it from scratch—and i definitely don't know macOS framework bullshit, so i threw the script into an llm and said "plz help, my clipboard, it's dying".

i learned a bunch, but was ultimately unsuccessful in convincing it to produce something that didn't result in a png. eventually i asked, "hey, you think this is...maybe impossible?" and it said "lol yeah probably":

> NSImage also treats images as **renderable content**, not **raw file formats**, so copying NSImage to the clipboard **always results in PNG**.

welp, that might explain why Retrobatch can't do this either!

<aside>

  i did try fucking with `NSData` instead of `NSImage` but no dice there either probably because  i don't know what the fuck i'm doing that'd be wild if macOS simply didn't consider this use case where i'd want the image data i clipped to remain unmangled

</aside>

despite watching me flounder about with a solution that it _knew_[^knowledge] wouldn't work, the robot did end up suggesting something useful: "Use AppleScript to Simulate Finder Copy (Hacky but Works)". you _know_ i'm about that "hacky but works" life so that's what I went with and it was hacky but it worked. that suggestion eventually became `pbfile`.

[^knowledge]: i know that llms don't actually know anything, let me live
## escape hatches rule

even though Retrobatch couldn't do what i needed with standard nodes, letting me drop down to custom scripts in my workflow made this possible in the end. i love tools that give me reasonable 2-way escape hatches! i can escape, but i can also _come back_, e.g. outputting `outputImagePath` from my script lets me return data back to the workflow. sometimes tools make you choose between blessed path and off-roading, so i like when tools consider reentry.

another thing i liked was being able to save the workflow as an executable `.app` let me easily run this from Raycast!

oh also btw i _did_ try imagemagick first since i hadn't really used Retrobatch yet and i figured this was a `magick` one-liner

```bash
; pbpaste | magick png:- output.webp
magick: improper image header `/var/folders/dz/t5n_l_h57tdg4784rrrwddcw0000gn/T/magick-Nhp35
2dTBLEFyvfyis1KskY7ZEAZ96H2' @ error/png.c/ReadPNGImage/3941
````

<aside>

  i stole the `;` as prompt thing from [kate](https://bsky.app/profile/katef.bsky.social), lets you can copy the whole line since `;` is a valid command separator! using something like `$` means having to mouse more acurately to avoid selecting the prompt character.
  
</aside>

i couldn't find anything useful about this error in a few minutes of searching so i just switched to Retrobatch thinking it'd be faster than trying to debug this.

## current listening

Deafheaven is screaming again, _we are so back_[^hater]

[^hater]: in the "music of Deafheaven" sense, not the **_gestures around_** sense. honestly tho i wasn't an [Infinite Granite](https://deafheavens.bandcamp.com/album/infinite-granite) hater, there's some bangers on there imo!

<iframe width="560" height="315" src="https://www.youtube.com/embed/2h_WVPSoMwU?si=WqCFGaRsKTjeNm06" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## appendix i: `timestamp-file`


```sh
#!/usr/bin/env bash

set -euo pipefail

# Check if at least one argument is provided
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 file1 [file2 ...]"
    exit 1
fi

# Regex to detect an ISO-like timestamp at the beginning of a filename
timestamp_regex='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}_'

for file in "$@"; do
    # Check if the file exists and is a regular file
    if [[ ! -f "$file" ]]; then
        echo "Error: File not found or not a regular file: $file"
        exit 1
    fi

    # Extract the filename (without directory)
    base=$(basename "$file")

    # Skip renaming if the filename already starts with a timestamp
    if [[ "$base" =~ $timestamp_regex ]]; then
        echo "Skipping: $file (already contains a timestamp)"
        continue
    fi

    # Get the creation time in RFC 3339 format (UTC)
    ctime=$(stat -f "%SB" -t "%Y-%m-%dT%H%M%S" "$file")
    if [[ -z "$ctime" ]]; then
        echo "Error: Unable to retrieve creation time for $file"
        exit 1
    fi

    # Extract directory
    dir=$(dirname "$file")

    # Construct new filename
    new_name="${dir}/${ctime}_${base}"
    if [[ -e "$new_name" ]]; then
        echo "Error: Target filename already exists: $new_name"
        exit 1
    fi

    # Rename the file
    mv "$file" "$new_name"

    # Required to chain the next Retrobatch step
    echo "outputImagePath: $new_name"
done
```

## appendix ii: `pbfile`

```sh
#!/usr/bin/env bash

set -euo pipefail  

# Check if a file argument is provided
if [[ $# -ne 1 ]]; then
    echo "Usage: pbfile <file-path>"
    exit 1
fi

# Ensure the file exists
file_path="$1"
if [[ ! -f "$file_path" ]]; then
    echo "Error: File not found: $file_path"
    exit 1
fi

# Convert to absolute path (handles relative paths correctly)
abs_path=$(realpath "$file_path")

# Use AppleScript to copy the file reference to clipboard
osascript -e "set the clipboard to (POSIX file \"$abs_path\")"

echo "Success: Copied file reference to clipboard: $abs_path"

```

<style>
aside {
    padding: 0 1em;
    opacity: 0.5;
}
iframe {
    max-width: 100%;
}
</style>
