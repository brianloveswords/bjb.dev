---
layout: ../../layouts/BlogPost.astro
title: preconditions are good
description: i'd rather blow up than corrupt
publishDate: draft
version: 1
---

- saw a tweet that said asserting preconditions is bad because eventually
  someone will catch all errors under the (misguided) assumption that programs
  should never crash, and then you end up masking errors.
- first off, the problem is not with preconditions, it's with overcatching
  errors. don't do that.
  - [not all errors are recoverable](https://joeduffyblog.com/2016/02/07/the-error-model/#bugs-arent-recoverable-errors)! sometimes the right thing to do is crash!
  - some languages make this more painful than others.
  - overcatching errors is a big source of bugs! [insert link to that paper here]
- second, having preconditions (and invariant assertions, and postconditions!)
  is a great way to make your program amenable to good fuzz testing.
- without pre/post conditions, your program will just chug away corrupting
  data until _something, somewhere_ realizes what's going on.
  - worst case scenerio: it's a _human user_ who realizes it days
    or weeks later, and their data is absolutely fucked.
- if you blow up right at the moment of a precondition violation, you give
  yourself a much better chance of figuring out what went wrong.
- instead of catching all errors to prevent crashing, try
  preconditions+fuzzing to figure out what combinations of inputs _causes_
  your program to crashes.
  - I think of fuzzing as a specific instance of property based testing: the
    property you are testing is that the program should not crash.
- preconditions should fire in instances where the programmer is doing
  something wrong: they should _not_ be used for general error handling, or
  user input checking.
- the boundaries of the program, where the program has to communicate with the
  outside world, should almost never crash. depending on your language of
  choice, the input should be [parsed (not
  validated)](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
  into a domain-specific type, and if that parsing fails, a reasonable error
  should be returned. In Rust, Scala, Haskell, etc. we can use the appropriate
  sum type (`Either`, `Option`, `Result`, etc); in Go you can use multiple
  return values.
