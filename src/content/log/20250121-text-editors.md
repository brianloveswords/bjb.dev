---
title: IDEs are bad at editing text
description: back to the old me
pubDate: 2025-01-21
image: /static/20250121/terminal.b39731dc710796ea16892f1ef87453a6.webp
---

<img loading=lazy src="/static/20250121/terminal.b39731dc710796ea16892f1ef87453a6.webp" width="1024" height="620" style="background: #393347;">

i was originally a vi user. i only got a few years muscle memory before i became an emacs user. everyone else in the lab used emacs and i didn't want to be the odd one out at that point in my life. if this is sounding familiar, i wrote about it in a series of footnotes in a previous post.

i used emacs for about 15 years before switching to vs code, and vs code for a few years before switching to zed. i'm living that manager life these days so most of my typing happens in obsidian (when i'm lucky and can scrape together the time i need to think about stuff).

every editor seems to have passable vim emulation but none have good emacs emulation. this is not their fault: to become fully immersed in emacs is to detach yourself from the reality that 99.999% of computer users live in. the [spacebar thing](https://xkcd.com/1172/) is a joke but just barely. during the throes of my devotion to the church of emacs, i made it so holding down `enter` acted as `control` so i could have a `control` key on the right side of the homerow[^capslock] and when friends joked about getting me a `control` foot pedal i might have actually considered it for a moment.

[^capslock]: swapping `capslock` with `control` is still the first thing i do on a new computer, it's so ingrained that i get confused using other people's computers where it's not swapped.

i've been considering whether to just go back to the old me and reinstall emacs. i miss org-mode, i enjoy writing lisp, and i'm no longer worried about sharing configs/plugins/etc with coworkers since nobody pays me to produce software anymore. i'm hesitant, though. as much as i felt productive, i was not living my best life, ergonomically speaking. i managed to fuck up my hands so bad once [jenn](https://jennschiffer.com/) made me pinky splints out of a broken pencil. i don't know if i'm ready to go back to that life. also, as much as i appreciate free software, i do not like stallman.[^stallman]

[^stallman]: he once walked by a room i was meeting in  and glared at me so hard that the person i was meeting with stopped and said "do you know him? why is he glaring at you like that?" and i couldn't answer, i had never met him and didn't know why! that's not why i don't like him, i just think that's a fun little tidbit.

and you know what, ever since the splints, i've thought maybe modal editing isn't so bad, maybe even better for not fucking up 🤚🏽 the ol' money-makers ✋🏽. at the time i didn't want to give up my muscle memory, but at this point it's thoroughly fucked anyway. i do still use as many emacs bindings as i'm able, where they are supported, but i'm finally free of the real deep shit. i even use the backspace key sometimes now instead of `ctrl-h`!

so i'm writing this in [helix](https://helix-editor.com/) rewiring my brain into modes instead of contorting my hands into chords[^chord]. i'm using chatgpt to try to accelerate through the friction phase: i tossed it the whole [keymap](https://docs.helix-editor.com/keymap.html), said it's a modal editor like vim, and i'm asking questions like "how do i move a line up, like the text, not just the cursor". it's frequently wrong, but it's wrong in ways that are instructive and lead me a little closer to the right answer.

[^chord]: multiple keys at once, usually with multiple modifiers. think about playing a chord on a piano.

## oh yeah terminal IDEs are also dogshit

using a terminal editor is nice! i don't need a lot of accoutrements, and i'm already used to mousing around as little as humanly possible. when i am mousin', my trackpad speed is jacked as high as it will possible go.

in fact, writing this reminded me that i hadn't yet installed [BetterTouchTool](https://folivora.ai/) on this computer which lets me crank the tracking speed _dangerously high_, or at least higher than the macOS settings will allow it to go.

having an absurdly fast trackpad is part of what dissuades me using an external keyboard/mouse because this whole setup feels more comfortable for me personally! i can whip the cursor around the screen with small flicks of my thumb, which is already a few centimeters from the trackpad since it's usually resting on spacebar. with a kb/mouse situation i had to physically _move my whole hand_ from the keyboard to put it on a whole separate device that was possibly _dozens_ of centimeters away.

anyway, terminal editor! i'm writing this in a [Zellij](https://zellij.dev/) pane split with an astro dev server and a regular 'ol shell in another. i forgot how much i like this setup! if i have complaints about text editing in IDEs (and i do), boy do i have straight up _gripes_ about terminal emulators in IDEs[^zed-gripe] so i always keep a spare open anyway. why not cut out the middleman?

[^zed-gripe]: latest gripe: something seems to have changed in zed and now I have to hit `Ctrl-k` twice when in a terminal to kill the line. alternatively, i can hit it once and wait _2 complete human seconds_ for it to work. it's not frozen, but it seems to be anticipating another key. i can likely fix this, but instead of spending the 5 minutes to figure out how to do that, i spent the entire night trying out helix and writing this fucking blog post.

using a modal editor seems to work pretty well in things like Zellij/tmux/screen whereas i remember it being pretty annoying in emacs without significant configuration to avoid keymap clash![^emacs-os]

[^emacs-os]: this didn't matter as much when i was at my most emacs poisoned since i did just about everything within those four walls. i used a dang emacs twitter client!

i'm not gonna `rm -r /Applications/Zed.app` but i'm going to try to do more of my typing in helix and see how it treats me. i frankly don't need a lot of fancy IDE stuff anyway; these days when i get to code, i'm mostly writing sql and bash, with a sprinkling of typescript, python, and rust when i'm allowed to have fun. i'm mostly editing _files_, not working on big projects with complex needs.

i also kinda like no built-in spellcheck! i try to stay in writing mode when i'm writing and not revert to editing mode, but those <span class=squiggle>dang squiggles</span> make me want to fix things immediately 👀 and then i'm drawn one step closer to the edit.

i'm gonna keep trying to get comfortable with helix, but if/when i go back to authoring posts in obsidian, this inspired me to toggle off spellcheck when i'm drafting. if i do stick with helix, i'm perfectly happy to do an `aspell` pass at the end![^homerow]

[^homerow]: as i was spellchecking and figuring out if it's "home row" or "homerow" (and whether i care), i found [Homerow.app](https://www.homerow.app/) which seems **entirely** my shit.

## currently listening

The Body & Dis Fig on Audiotree Live

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/K6zxqcgn6tw?si=tdJulSxk514s0kqH" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


<style>

.squiggle {
  text-decoration: underline;
  text-decoration-color: red;
  text-decoration-style: wavy;
  text-decoration-skip-ink: none;
}

</style>
