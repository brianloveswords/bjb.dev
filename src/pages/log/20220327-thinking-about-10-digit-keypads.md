---
layout: ../../layouts/BlogPost.astro
title: thinking about 10-digit keypads
description: thought crimes with imaginary safes
publishDate: 2022-03-27
version: 1
---

Let's say we're thieves and we're breaking into a safe that has a standard 10-digit keypad and you know it requires a 4-digit code.

We have have some technology that allows us to see the buttons that have been pressed, like a fingerprinting kit[^1]. If the code is `[4 2 2 0]`, we'll be able to recover the unordered set `#{0 4 2}`

Let's assume we get perfect fidelity into which buttons were pressed—all found digits appear in the code, and the code is made exclusively of found digits. What's the worst case scenario?

## i'm writing this to practice math

I could probably figure out the right set of terms to look up an answer to this, but I want to practice reasoning it out as far as possible with math (and experimentally with programming when I can't figure it out with math).


## before dusting for prints

On a 10-digit keypad with a 4-digit code, everything between 0000-9999 is valid.

<p>
<em>base<sup>length</sup></em> = 10<sup>4</sup> = 10,000 possibilities
</p>

If we know the `7` button is broken and can't be used in any codes, the remaining valid digit set is `#{1 2 3 4 5 6 8 9 0}`, so there would be 9<sup>4</sup> = 6,561 possible codes.

## 1 digit

1<sup>4</sup> = 1 code

If we dust and only the `9` digit was pressed, we can reduce the valid digit set for the code to `#{9}`. We know the length of the code is always four, so the only valid code is `[9 9 9 9]`.

This is the best case scenario.

## 2 digits

2<sup>4</sup> = 16 possibilities *at most.*

Let's say `7` and `4` come up. The base possibilities are:

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

...but two of these don't make sense: since we found `7` and `4`, both must be observed in the code. This means we can rule out `4444` and `7777`, leaving 14 possibilities.

Thinking about it in binary might be useful: the only two states where all bits are the same are when all bits are set (`1111`) or all bits are clear (`0000`). Everything else has a combination of 1 and 0 bits so those would be valid.

## Three different digits

3<sup>4</sup> = 81 possibilities *at most.*

Like before, we can omit some of the codes. I can't think of a good way to express the rule in math and I can't think in trinary so I can't take a mental shortcut. Gonna have to count it out.

_...counting it out[^2]..._

Alright so 45 can be ruled out, leaving 36 of them valid.

## Four different digits

4<sup>4</sup> = 256 possibilities *at most.*

We can use a trick for this one so we don't have to count it out: it's the set of permutations for the found digit set, so `4! = 24` possibilities.

The intuition is this: each member of the found digit set *must* be used, and since the size of the code and the found digit set match, each digit must be used exactly once. This means each button press in the code "consumes" that choice, and the next button press has one fewer option to choose from.

Say we find `#{9 4 1 8}`. An example of a valid code:

```
1st digit: #{9 4 1 8} = 9
2nd digit: #{  4 1 8} = 1
3rd digit: #{    4 8} = 8
4th digit: #{      4} = 4
```

We can choose the the digits in a different order, but we always have one fewer option for each character as we enter the code.

4 choices ⨉ 3 choices ⨉ 2 choices ⨉ 1 choice = 24 choices

This is a better case for us as thieves than finding just 3 digits.

## Longer codes!

The worst case is not the one that uses the largest digit set for code because we're trading information: add one more bit to the keyspace, but invalidates part of the keyspace since it adds another restriction in that the combination must include the additional digit.

I'm interested in how this pans out for longer codes but I don't know how to express this mathematically, so I wrote some inefficient throwaway code[^3] to calculate it.

```clojure
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
  #(>= (count %) n))

(def into-set #(into #{} %))

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


(map #(dust-for-prints-4 %) (range 1 5))
;; => (1 14 36 24)
(map #(dust-for-prints-5 %) (range 1 6))
;; => (1 30 150 240 120)
(map #(dust-for-prints-6 %) (range 1 7))
;; => (1 62 540 1560 1800 720)
(map #(dust-for-prints-7 %) (range 1 8))
;; => (1 126 1806 8400 16800 15120 5040)
(map #(dust-for-prints-8 %) (range 1 9))
;; => (1 254 5796 40824 126000 191520 141120 40320)
```

## what is the relationship?

I have no idea but it's interesting! Up through 6-digit codes, the worse case scenario is at  `n-1` digits, between 7 and 8 it's at `n-2`.  They seem to follow roughly similar curves. I'd like to check 9+ but I only wanted to spend a few hours on this and I'm out of time, also my code is too inefficient to go higher and I don't want to rewrite it right now!

When I learn more math I might come back to this and try to figure out if I can describe this with an equation.

[^1]: Or visible wear and tear on the keys themselves. I scrolled past a tweet depiciting exactly that, with 4 keys clearly worn, which is what made me start thinking about this.

[^2]: using `#{0 1 2}` as the found set, `["0000" "0001" "0002" "0010" "0011" "0012" "0020" "0021" "0022" "0100" "0101" "0102" "0110" "0111" "0112" "0120" "0121" "0122" "0200" "0201" "0202" "0210" "0211" "0212" "0220" "0221" "0222" "1000" "1001" "1002" "1010" "1011" "1012" "1020" "1021" "1022" "1100" "1101" "1102" "1110" "1111" "1112" "1120" "1121" "1122" "1200" "1201" "1202" "1210" "1211" "1212" "1220" "1221" "1222" "2000" "2001" "2002" "2010" "2011" "2012" "2020" "2021" "2022" "2100" "2101" "2102" "2110" "2111" "2112" "2120" "2121" "2122" "2200" "2201" "2202" "2210" "2211" "2212" "2220" "2221" "2222"]`

[^3]: I happen to be reading a Clojure book so I figured I'd try it out in Clojure. I could probably reduce the copy and pasting with a macro, and in fact I tried for about 10 minutes but couldn't figure it out.
