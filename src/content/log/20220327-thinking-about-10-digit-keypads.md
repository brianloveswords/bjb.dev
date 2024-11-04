---
title: thinking about 10-digit keypads
description: committing math crimes with imaginary safes
pubDate: 2022-03-27
---

Let's say we're thieves and we're breaking into a safe. It uses a standard 10-digit keypad and requires a 4-digit code.

We have some way of knowing which buttons are most frequently pressed, like a fingerprinting kit or [observable wear and tear](https://twitter.com/MalwareJake/status/1507726475939790852). As an example, if the code is `[4 2 2 0]`, we'll recover the unordered set `#{0 4 2}`. We'll know which buttons were pressed, but not in what order.

Let's also assume perfect fidelity: all found digits appear in the code, and the code is made exclusively of found digits.

What codes are better or worse for thwarting our thievery?

## everybody loves word problems, right?

My approach might not the easiest way to think about this, and it might not even be right! I'm trying to get better at turning problems into math. Computers tend to be pretty good at math, so it feels useful to be able to decompose scenarios into a bunch of math.

There's gonna be a point where I can't math it out anymore, and I'll resort to solving stuff experimentally with programming.

## before dusting for prints

On a 10-digit keypad with a 4-digit code, before we get any information to tell us otherwise, every code between 0000-9999 is a possibility. We can use this equation to calculate the size of the keyspace:

<p>
<em>base<sup>length</sup></em> = 10<sup>4</sup> = 10,000 possibilities
</p>

If we know the `7` button is broken and can't be used in any codes, the remaining valid digit set would be:

```
#{1 2 3 4 5 6 8 9 0}
```

so there would be 9<sup>4</sup> = 6,561 possible codes.

If we dust those digits and find a set of size `n`, we can calculate the _maximum_ size of the keyspace with <em>n<sup>4</sup></em>.

We'll generally get to remove some entries from the initial keyspace since all valid codes must include all digits from the found set. The exception is if we find only 1 digit, since the keyspace is exactly 1 code in that case.

## One digit found

1<sup>4</sup> = 1 possible code

If we dust and only the `9` digit was pressed, we can reduce the valid digit set for the code to `#{9}`. We know the length of the code is always four, so the only valid code is `[9 9 9 9]`.

Please don't secure your valuables with a 1-digit code.

## Two digits found

2<sup>4</sup> = 16 possibilities *at most.*

Let's say `7` and `4` come up. The base set of possibilities are:

```
4444*
4447
4474
4477
4744
4747
4774
4777
7444
7447
7474
7477
7744
7747
7774
7777*
```

Since we found `7` and `4` when we dusted, we know that both of those digits must be observed in the code. This allows us to rule out `4444` and `7777`, which leaves 14 possibilities.

Thinking about it in binary terms is helpful to me: the only two states that have a homogenous bitstring are at the maximum (`1111`) and minimum (`0000`). Everything else has a combination of 1 and 0 bits.

## Three digits found

3<sup>4</sup> = 81 possibilities *at most.*

Like before we can omit some of the codes, but I can't think of a good way to express the rule in math and I can't think in trinary so I can't take a mental shortcut. Gonna have to count it out.

Using `#{0 1 2}` as the found set, and Clojure because I happen to be reading a Clojure book and I have a REPL open:

```clojure
(count
  (filter
    #(= (count (into #{} %)) 3) ;; require 3 distinct digits
    #{"0000" "0001" "0002" "0010" "0011" "0012" "0020" "0021" "0022"
      "0100" "0101" "0102" "0110" "0111" "0112" "0120" "0121" "0122"
      "0200" "0201" "0202" "0210" "0211" "0212" "0220" "0221" "0222"
      "1000" "1001" "1002" "1010" "1011" "1012" "1020" "1021" "1022"
      "1100" "1101" "1102" "1110" "1111" "1112" "1120" "1121" "1122"
      "1200" "1201" "1202" "1210" "1211" "1212" "1220" "1221" "1222"
      "2000" "2001" "2002" "2010" "2011" "2012" "2020" "2021" "2022"
      "2100" "2101" "2102" "2110" "2111" "2112" "2120" "2121" "2122"
      "2200" "2201" "2202" "2210" "2211" "2212" "2220" "2221" "2222"}))
;; => 36
```

Alright so 36 are valid because they contain all 3 found digits, and 45 of them can be ruled out.

## Four digits found

4<sup>4</sup> = 256 possibilities *at most.*

We can use a trick for this one so we don't have to count it out: it's the set of permutations for the found digit set, so `4! = 24` possibilities.

My intuition is this: each member of the found digit set *must* be used, and since the size of the code and the found digit set match, each digit must be used exactly once. This means each button press in the code "consumes" that choice, and the next button press has one fewer option to choose from.

Say we find `#{9 4 1 8}`. An example of a valid code:

```
1st digit: #{9 4 1 8} = 9
2nd digit: #{  4 1 8} = 1
3rd digit: #{    4 8} = 8
4th digit: #{      4} = 4
```

We can choose the the digits in a different order, but we always have one fewer option for each character as we enter the code.

4 choices ⨉ 3 choices ⨉ 2 choices ⨉ 1 choice = 24 choices

As thieves, this is a better case for us than finding 3 digits!

- best case: 1 digit (1 code)
- good case: 2 digits (14 codes)
- worst case: 3 digits (36 codes)
- alright case: 4 digits (24 codes)

## Longer codes

The worst case is not the one that uses the largest digit set for code because there's a tradeoff: another digit adds one more bit to the keyspace, but also invalidates more of the keyspace since it adds another restriction (valid combinations must include all digits).

I'm interested in how this pans out for longer codes but I don't know how to express this mathematically, so I wrote some inefficient throwaway code to calculate it.[^code]

<details>

  <summary>Expand this dropdown to see the setup code</summary>

```clojure
;; nothing about this code is production ready.
;; don't use it for anything important!

(defn gen-possibilities-4 [size]
  (let [alpha (range size)]
    (for [x1 alpha x2 alpha x3 alpha x4 alpha]
      (str x1 x2 x3 x4))))
(defn gen-possibilities-5 [size]
  (let [alpha (range size)]
    (for [x1 alpha x2 alpha x3 alpha x4 alpha x5 alpha]
      (str x1 x2 x3 x4 x5))))
(defn gen-possibilities-6 [size]
  (let [alpha (range size)]
    (for [x1 alpha x2 alpha x3 alpha
          x4 alpha x5 alpha x6 alpha]
      (str x1 x2 x3 x4 x5 x6))))
(defn gen-possibilities-7 [size]
  (let [alpha (range size)]
    (for [x1 alpha x2 alpha x3 alpha
          x4 alpha x5 alpha x6 alpha x7 alpha]
      (str x1 x2 x3 x4 x5 x6 x7))))
(defn gen-possibilities-8 [size]
  (let [alpha (range size)]
    (for [x1 alpha x2 alpha x3 alpha x4 alpha
          x5 alpha x6 alpha x7 alpha x8 alpha]
      (str x1 x2 x3 x4 x5 x6 x7 x8))))


(defn size-is [n]
  #(= (count %) n))

(def into-set #(into #{} %))

(def up-to #(range 1 (+ % 1)))

(defn dust-for-prints-4 [n]
  (let [possible (map into-set (gen-possibilities-4 n))]
    (count (filter (size-is n) possible))))
(defn dust-for-prints-5 [n]
  (let [possible (map into-set (gen-possibilities-5 n))]
    (count (filter (size-is n) possible))))
(defn dust-for-prints-6 [n]
  (let [possible (map into-set (gen-possibilities-6 n))]
    (count (filter (size-is n) possible))))
(defn dust-for-prints-7 [n]
  (let [possible (map into-set (gen-possibilities-7 n))]
    (count (filter (size-is n) possible))))
(defn dust-for-prints-8 [n]
  (let [possible (map into-set (gen-possibilities-8 n))]
    (count (filter (size-is n) possible))))
```
</details>


```clojure
(map #(dust-for-prints-4 %) (up-to 4))
;; => (1 14 36 24)
(map #(dust-for-prints-5 %) (up-to 5))
;; => (1 30 150 240 120)
(map #(dust-for-prints-6 %) (up-to 6))
;; => (1 62 540 1560 1800 720)
(map #(dust-for-prints-7 %) (up-to 7))
;; => (1 126 1806 8400 16800 15120 5040)
(map #(dust-for-prints-8 %) (up-to 8))
;; => (1 254 5796 40824 126000 191520 141120 40320)
```

Up through 6-digit codes, the worse case scenario is at  `n-1` digits, between 7 and 8 it's at `n-2`.

The results seem to follow roughly similar curves. I'm interested in 9+ digits but my code is too inefficient: calculating results for 7 digit codes takes a few seconds, and 8 digit codes take about a minute. I *might* be able to get 9 digit codes in under an hour, but I timeboxed this experiment and I'm running out of time so I'm not going to try to rewrite it, I'll leave that as an exercise for future-me.

## can we describe the relationship with a single equation?

Wish I could! Feels like we should be able to, but I don't know enough math technique to figure out how.

```haskell
-- haskell enters the chat
f :: Int -> Int -> Int

-- some known examples
f 2 4 = 14
f 4 4 = 24
f 4 5 = 240
f 4 6 = 1560

-- generalizing
f 1 y = 1
f 2 y = 2^y - 2
f x y
  | x == y    = product [1..x] -- factorial
  | otherwise = undefined      -- ???
```

[^code]: I could reduce the copy and pasting with a macro, and in fact I tried for about 10 minutes I gave up because this is a post about math(s) not macro(s).
