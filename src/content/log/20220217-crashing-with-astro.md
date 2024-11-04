---
title: crashing with Astro
description: touch fuzzy get dizzy
pubDate: 2022-02-17
---

_Currently listening to: [MØL – Diorama](https://moeldk.bandcamp.com/album/diorama)_

I mentioned in [my last post](/log/20220216-static-site-generator) that [Astro](https://astro.build) might be a good fit for what I'm looking for in a static site generator so I figured I don't have a ton of content, might as well just go all in and port the whole thing over and see how it goes.

I began converting the templates and content from my current site and at some point `npm run build` started blowing up. I didn't notice this right away because the live server started by  `npm run dev` worked more-or-less fine, it would only give me errors when I restarted the process or ran `npm run build`.

## semver is a lie we tell ourselves and each other

The version I'm using is `0.22.20`. The stability of pre-1.0 versions ranges from "crashes every third time you run it" to "rock solid" because semver is a lie we all pretend to believe so we can maintain the illusion version numbers have any meaning beyond "number gets bigger".

My heuristic for judging project stability and how much I should prepare for a broken experience does not include project version: it's almost entirely based on the quality of documentation. The Astro docs are pretty good, and I even found this reassuring quote on the [Comparing Astro](https://docs.astro.build/en/comparing-astro-vs-other-tools/) page that's relevant (emphasis mine):

> A few features are still missing from Astro, and several APIs are not yet finalized. However, the project is **considered stable from a bug perspective** and several production websites have already been built using Astro. This is an important point to consider when choosing Astro.


## back to breaking stuff

I removed stuff until I got it building, then added stuff back until it broke again. I got the repro case down to a build with a single file, `src/pages/index.astro`, and I went through a few discovery paths within that file: was it some broken HTML? I have some multibyte characters in here, is that messing anything up? Is there anything strange about my frontmatter?

Nothing was adding up. I'd make some tag changes, add some more multibyte, take some away—the failures seemed random. I started to worry this bug was either non-deterministic or based on hidden persisted state, like a build cache I didn't know about.

Then I had a thought: what if there is no relationship to _my specific content_? I reverted back to what I started with and began replacing the contents of the file, byte by byte, with `x`s.

This intuition proved correct, the crash had nothing to do with the semantics of the file _at all_. The code path that triggered it was completely determined by the number of bytes in the file. So I wrote a lil fuzzer (see **Appendix A**) to write an increasing number of bytes to  `src/pages/index.astro` and keep track of where it started failing. I let it run for a few hours and the results were fascinating:

- `0000-2912` bytes: 🆗
- `2913-2928` bytes: `RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!`
- `2929-2944` bytes: `TypeError: Cannot read properties of undefined (reading 'code')`
- `2945-2976` bytes: 👍🏽
- `2977-2992` bytes: `panic: runtime error: nil pointer dereference`
- `2993-3024` bytes: ⛵️
- `3025-3104` bytes: `panic: runtime error: nil pointer dereference`
- `>= 3105` bytes: 😎

[^wasm]: I also manually found a 4th way of getting the compiler to blow up that is _mostly_ based on file size, but it does require having some of the bytes be in a frontmatter section. That one triggers an entirely different error path having to do with WASM, `null function or function signature mismatch`.


There are three distinct types[^wasm] of 💣💥 that occur in four different ranges. The first three ranges are all 16 bytes wide, and the last range is 80 bytes wide, which are numbers that makes my computer brain feel nice, but I am not sure why the errors appear at those specific offsets.

It's possible there's something going on in 16 byte chunks. Looking at the last good byte before the offsets, `[2912, 2928, 2976, 3024]`, those are all divisible by 16, so the next byte which is the one that starts causing the failure would be the start of a new chunk. This could absolutely be a coincidence, though.

## bias confirmed

I love testing because it lets me pretend my software will work out there in the dangerous and hostile world of _actual user input_.

I love _generating test cases_ even more because I want to run a lot of tests but coming up with them by hand is hella boring and also suffers from my own bias of knowing how the dang thing works—I'm more likely to test stuff I _think_ would fail, which tends to be loosely correlated at best with how things _actually fail in the wild_.

If I were developing Astro (and maybe I'll try to contribute if I decide to stick with it for the long haul) I would toss some [property tests](https://increment.com/testing/in-praise-of-property-based-testing/) into the mix. The types of failures found in this post are exactly the kinda stuff I've caught with property-based testing, and the "shrinking" that most frameworks provide would have likely been able to identify (or at least point toward) a minimal repro case.

In the JavaScript/TypeScript ecosystem, [`fast-check`](https://github.com/dubzzz/fast-check) is by far the best library for property-based testing. If you write either of these languages for fun or profit and you haven't tried out `fast-check`, please stop reading my dumb words go check it out.

As far as that `nil pointer derefence`, sure does smell an awful lot like Go. As of `1.18` [fuzzing is part of the standard tooling](https://go.dev/doc/fuzz/). I don't know what part of the Astro toolchain is written in Go, but it could probably benefit from some fuzzing.

Even without any special tools or frameworks, there's big payoff to writing code that generates tests. I almost don't wanna call what I wrote for this exploration a "fuzzer" because it's deterministically testing a very specific part of the state space, but even with relatively low effort this method found (at least) four distinct code paths that have unexpected behavior!

Dan Luu has a great post about this: [Given that devs spend the effort they do on testing, what can we do to improve testing?](https://danluu.com/testing/)


## this is already fixed in the next version

I started putting together a bug report and figured I should test against the latest prerelease, make sure it hasn't been fixed before I put a lot of effort into explaining the problem and cleaning up the reproduction cases.

I ran the fuzzer against `0.23.0-next.9` and as it turns out this is fixed! Clean bill of health. Might be interesting to dig into the diff between `0.22.20` and `0.23.0-next.9` to figure out what changed that could have fixed this bug, but I'm supposed to be porting content right now so I need to stop this side quest before I get even more distracted.

I ran into a few other bugs that I didn't write about here that were not as interesting, but even still this isn't close to the worst experience I've had trying out a piece of software and this post is not trying to slam the Astro devs. I am a Spiders Georg of software bugs, an outlier who should not be counted. Everything[^vscode] I touch[^obsidian] breaks[^docker] nearly immediately just trying to use it normally (well, normal for me).

[^obsidian]: I'm drafting this post in Obsidian and I've had to force-refresh it about 5 times because it keeps, I don't know how to describe it, eating the text I write? I type, text shows up, but the cursor doesn't move and when I click somewhere else the text goes away. I think this started when I added **Appendix C** but I'm not entirely sure.

[^docker]: If I keep Docker for Mac open, it does something weird to my _sound_. I don't know why Docker is messing with sound subsystems at all, but it causes my sound to cut in and out unless I `killall -9 coreaudio` every once in a while.

[^vscode]: I'm doing the component/template development in VS Code. I've had to use `Developer: Reload Window` about 7 times in the last day because it will stop letting me type _numbers_. I can type other stuff, but for some reason it just refuses to put a number in the file if I press 0-9. This almost certainly has to do with the interplay of new VS Code version and some extension I'm using because it just started doing this after a recent VS Code update.


## Appendix A: `fuzz.mjs`
```javascript
// @ts-check

/**
 * fuzz.mjs - test `astro build` with increasing file sizes.
 *
 * usage:
 * ```bash
 * $ START=1 END=10240 node fuzz.mjs | tee -a out.ndjson
 * ```
 *
 * to cancel and resume:
 *  - Ctrl+C
 *  - look at the last line of output
 *  - in the next invocation, update `START=` with the last `n`
 *
 * note: this is slow. if I were productionizing this I'd put some effort into
 * paralellizing it, but there wasn't a straightforward way to do that with my
 * setup and I'm only gonna be running this once or twice, so It's Fine™.
 */

import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import { join as pathJoin } from "path";

async function main() {
    let start = mustGetNumFromEnv("START");
    let end = mustGetNumFromEnv("END");

    for (let n of range(start, end)) {
        let result = await runBuild(n);
        process.stdout.write(JSON.stringify(result) + "\n");
    }
}

/**
 * @param {boolean} ok
 * @param {string} msg
 */
function precondition(ok, msg) {
    if (!ok) {
        fail("ERROR:", msg);
    }
}

/**
 * @param {string[]} msg
 * @returns {never}
 */
function fail(...msg) {
    console.error("ERROR:", ...msg);
    process.exit(1);
}

/**
 * @param {string} name
 * @returns {number}
 */
function mustGetNumFromEnv(name) {
    let val = process.env[name];
    if (val === undefined) {
        return fail(`Expected environment variable ${name} to be defined`);
    }

    let failWithMsg = () =>
        fail(`Expected environment variable ${name} to be an integer (got '${val}')`);

    try {
        let num = parseInt(val, 10);
        if (Number.isNaN(num)) {
            return failWithMsg();
        }
        return num;
    } catch (err) {
        return failWithMsg();
    }
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {Generator<number>}
 */
function* range(start, end) {
    precondition(start <= end, "start must be <= end");
    precondition(start > 0, "start must be > 0");

    for (let i = start; i <= end; i++) {
        yield i;
    }
}

/**
 * @typedef {Object} BuildResult
 * @property {number} n
 * @property {boolean} ok
 * @property {string|null} out
 */

/**
 * @param {number} [n]
 * @returns {Promise<BuildResult>}
 */
async function runBuild(n) {
    await writeTestFile(n);
    return new Promise((resolve, reject) => {
        let data = "";
        let proc = spawn("./node_modules/.bin/astro", ["build"], {});
        proc.stdout.on("data", (chunk) => (data += chunk));
        proc.stderr.on("data", (chunk) => (data += chunk));
        proc.once("close", (code) => {
            let ok = code === 0;
            resolve({ n, ok, out: ok ? null : data });
        });
        proc.on("error", (err) => {
            console.error(err);
            reject(err);
        });
    });
}

/**
 * @param {number} n
 * @returns {Promise<void>}
 */
function writeTestFile(n) {
    return writeFile(pathJoin("src", "pages", "index.astro"), byteFill(n));
}

/**
 * @param {number} n
 * @param {string} c
 * @returns {Buffer}
 */
function byteFill(n, c = ".") {
    let buf = Buffer.alloc(n, c);
    return buf;
}

await main();
```


## Appendix B: `clean.mjs`
```javascript

// @ts-check

/**
 * clean.mjs - clean up logs generated by `fuzz.mjs`
 *
 * There is some boilerplate noise in the raw logs of `astro build` that
 * aren't necessary for understanding the compiler bugs. This script cleans up
 * the output just the set of failures with the minimal output necessary to
 * understand the class of failure.
 *
 * usage:
 * ```bash
 * $ node clean.mjs <out.ndjson >out.clean.ndjson
 * ```
 */

import { readFileSync } from "fs";

function main() {
    const input = readFileSync(0).toString("utf8");
    const lines = input.trim().split("\n");
    for (const line of lines) {
        processLine(line, process.stdout);
    }
}

/**
 * @param {string} line
 * @param {NodeJS.WriteStream} stream
 */
function processLine(line, stream) {
    let obj = parseLine(line);
    stream.write(JSON.stringify(obj) + "\n");
}

/**
 * @param {string} line
 */
function parseLine(line) {
    let obj = JSON.parse(line);
    let { n, ok } = obj;
    if (obj.ok) {
        return { n, ok };
    }
    let out = cleanOutput(obj.out);
    return { n, ok, out };
}

/**
 * @param {string} out
 */
function cleanOutput(out) {
    let empty = {
        done: false,
        result: "",

        /**
         * @param {string} line
         */
        merge(line) {
            let { done, result } = this;

            if (done) {
                return this;
            }

            if (line.includes("buildOptions.site")) {
                return { ...this };
            } else if (line.trim().startsWith("Please open")) {
                return { ...this, done: true };
            } else {
                return { ...this, done: false, result: result + "\n" + line };
            }
        },
    };
    let { result } = out.split("\n").reduce((acc, line) => acc.merge(line), empty);
    return result.trim();
}

main();
```

## Appendix C: `out.clean.ndjson`

```json
{"n":2900,"ok":true}
{"n":2901,"ok":true}
{"n":2902,"ok":true}
{"n":2903,"ok":true}
{"n":2904,"ok":true}
{"n":2905,"ok":true}
{"n":2906,"ok":true}
{"n":2907,"ok":true}
{"n":2908,"ok":true}
{"n":2909,"ok":true}
{"n":2910,"ok":true}
{"n":2911,"ok":true}
{"n":2912,"ok":true}
{"n":2913,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2914,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2915,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2916,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2917,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2918,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2919,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2920,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2921,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2922,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2923,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2924,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2925,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2926,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2927,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2928,"ok":false,"out":"RuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2929,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2930,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2931,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2932,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2933,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2934,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2935,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2936,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2937,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2938,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2939,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2940,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2941,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2942,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2943,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2944,"ok":false,"out":"TypeError: Cannot read properties of undefined (reading 'code')"}
{"n":2945,"ok":true}
{"n":2946,"ok":true}
{"n":2947,"ok":true}
{"n":2948,"ok":true}
{"n":2949,"ok":true}
{"n":2950,"ok":true}
{"n":2951,"ok":true}
{"n":2952,"ok":true}
{"n":2953,"ok":true}
{"n":2954,"ok":true}
{"n":2955,"ok":true}
{"n":2956,"ok":true}
{"n":2957,"ok":true}
{"n":2958,"ok":true}
{"n":2959,"ok":true}
{"n":2960,"ok":true}
{"n":2961,"ok":true}
{"n":2962,"ok":true}
{"n":2963,"ok":true}
{"n":2964,"ok":true}
{"n":2965,"ok":true}
{"n":2966,"ok":true}
{"n":2967,"ok":true}
{"n":2968,"ok":true}
{"n":2969,"ok":true}
{"n":2970,"ok":true}
{"n":2971,"ok":true}
{"n":2972,"ok":true}
{"n":2973,"ok":true}
{"n":2974,"ok":true}
{"n":2975,"ok":true}
{"n":2976,"ok":true}
{"n":2977,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2978,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2979,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2980,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2981,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2982,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2983,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2984,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2985,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2986,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2987,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2988,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2989,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2990,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2991,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2992,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":2993,"ok":true}
{"n":2994,"ok":true}
{"n":2995,"ok":true}
{"n":2996,"ok":true}
{"n":2997,"ok":true}
{"n":2998,"ok":true}
{"n":2999,"ok":true}
{"n":3000,"ok":true}
{"n":3001,"ok":true}
{"n":3002,"ok":true}
{"n":3003,"ok":true}
{"n":3004,"ok":true}
{"n":3005,"ok":true}
{"n":3006,"ok":true}
{"n":3007,"ok":true}
{"n":3008,"ok":true}
{"n":3009,"ok":true}
{"n":3010,"ok":true}
{"n":3011,"ok":true}
{"n":3012,"ok":true}
{"n":3013,"ok":true}
{"n":3014,"ok":true}
{"n":3015,"ok":true}
{"n":3016,"ok":true}
{"n":3017,"ok":true}
{"n":3018,"ok":true}
{"n":3019,"ok":true}
{"n":3020,"ok":true}
{"n":3021,"ok":true}
{"n":3022,"ok":true}
{"n":3023,"ok":true}
{"n":3024,"ok":true}
{"n":3025,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3026,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3027,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3028,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3029,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3030,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3031,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3032,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3033,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3034,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3035,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3036,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3037,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3038,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3039,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3040,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3041,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3042,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3043,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3044,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3045,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3046,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3047,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3048,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3049,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3050,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3051,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3052,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3053,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3054,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3055,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3056,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3057,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3058,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3059,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3060,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3061,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3062,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3063,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3064,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3065,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3066,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3067,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3068,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3069,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3070,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3071,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3072,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3073,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3074,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3075,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3076,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3077,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3078,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3079,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3080,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3081,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3082,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3083,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3084,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3085,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3086,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3087,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3088,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3089,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3090,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3091,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3092,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3093,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3094,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3095,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3096,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3097,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3098,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3099,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3100,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3101,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3102,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3103,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3104,"ok":false,"out":"panic: runtime error: nil pointer dereference\nRuntimeError: Error: Uh oh, the Astro compiler encountered an unrecoverable error!"}
{"n":3105,"ok":true}
{"n":3106,"ok":true}
{"n":3107,"ok":true}
{"n":3108,"ok":true}
{"n":3109,"ok":true}
{"n":3110,"ok":true}
{"n":3111,"ok":true}
{"n":3112,"ok":true}
{"n":3113,"ok":true}
{"n":3114,"ok":true}
{"n":3115,"ok":true}
{"n":3116,"ok":true}
{"n":3117,"ok":true}
{"n":3118,"ok":true}
{"n":3119,"ok":true}
{"n":3120,"ok":true}
```
