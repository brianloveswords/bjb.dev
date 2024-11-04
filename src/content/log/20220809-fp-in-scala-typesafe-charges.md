---
title: "fp in scala: typesafe charges"
description: probably not a good idea, but let's give it a shot
pubDate: 2022-08-09
---

I'm reading the second edition of [Functional Programming in Scala](https://www.manning.com/books/functional-programming-in-scala-second-edition) and this is an example from the first chapter:

```scala
// CreditCard is not not defined the book so let's make something up
case class CreditCard(id: Long)

case class Charge(cc: CreditCard, amount: Double):
  def combine(other: Charge): Charge =
    if cc == other.cc
    then Charge(cc, amount + other.amount)
    else throw new Exception("Can't combine charges to different cards")
```

The book mentions we'll come back around to that `throw` and replace it with functional error handling, likely with `Either`, but I recently watched a video on [type-level operations in Scala](https://www.youtube.com/watch?v=6OaW-_aFStA) and wondered if I could write a version of this that is entirely free of runtime errors.

Turns out we can if we give `CreditCard` a phantom type parameter and a helper to construct it:

```scala
case class CreditCard[T](id: Long)
object CreditCard:
  def apply[T](id: Long): CreditCard[n.type] =
    CreditCard(id)

case class Charge[T](cc: CreditCard[T], amount: Double):
  def combine(other: Charge[T]): Charge[T] =
    Charge(cc, amount + other.amount)

val charge = Charge(CreditCard(1), 1.0)

charge.combine(Charge(CreditCard(1), 2.0)) // works!
charge.combine(Charge(CreditCard(2), 2.0)) // ❌
```

If I toss this in a worksheet, I get the squiggles `CreditCard(2), 2.0)`,
telling me:

```
Found:    App.this.CreditCard[(2L : Long)]
Required: App.this.CreditCard[(1L : Long)]
```

## Is this a good idea?

I'm not sure! Probably depends on the specific domain, how things are being
used, and what's knowable at compiletime vs runtime. I can think of at least
one way this makes things harder.

Suppose want to look up a credit card by a username:

```scala
def lookupByName[T](user: String): CreditCard[T] =
  new CreditCard(9) // dummy implementation
```

We're required to use `new` here because `CreditCard(9)` makes a
`CreditCard[(9L : Long)]`, not a `CreditCard[T]`. Using that `new` leaves us
with a `CreditCard[Nothing]`, which is compatible with every other
`CreditCard` that is looked up by name!

This problem is not insurmountable, we could always add more indirection and
abstraction, like maybe `GenericCreditCard` that can be promoted into a
`CreditCard[T]`. This makes the technique more cognitively expensive, though,
and it's not clearly better than just using an `Either`.
