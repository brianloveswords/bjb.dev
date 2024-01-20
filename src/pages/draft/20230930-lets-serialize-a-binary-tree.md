---
layout: ../../layouts/BlogPost.astro
title: let's serialize a binary tree
description: why not
publishDate: 2023-09-30
---


here's a coding problem I came across that got me thinking

---

Given the root to a binary tree, implement serialize(root), which serializes the tree into a string, and deserialize(s), which deserializes the string back into the tree.

For example, given the following Node class

```python
class Node:
    def __init__(self, data, left=None, right=None):
        self.data = data
        self.left = left
        self.right = right
```
The following test should pass:

```python
node = Node('root', Node('left', Node('left.left')), Node('right'))
assert deserialize(serialize(node)).left.left.data == 'left.left'
```

---

if I were got this as an interview question I'd need to figure out if they are testing more for how I'd handle recursive data structures, or are they interested in what type of serialization protocol I'd come up with.

so maybe I'd ask "what situation am I in where I wouldn't use an existing serialization protocol?" and see if the scenario can get fleshed out more. even if they just said "this is a case where a special protocol makes sense", that's a clue! but maybe they'd say "we're looking to see you can do this from scratch" and I'd know they're probably looking more for how I'd handle recursive structures.

why this matters: I'll spend more time explaining my protocol choices and working on that and risk running out of time on implementation if that's more important. otherwise, I'll half-ass that and focus on the implementation.

## let's design a protocol

I'm assuming  by the way the question is structured that this interviewer is less interested in protocol design than they are in evaluating if the candidate can handle recursive parsing.

but I think the design of the protocol is the more fun & interesting part, so I'm gonna focus on that.

the example is Python, but I'm gonna use Rust because that's what I've been programming recently, and it will require solving some bonus lifetime problems when trying to do while minimizing allocations, _what fun!_

## assumptions
- `data` is always a string
    - ...but we we _may_ want to support other types in the future
- performance matters
    - ...but is not crucial, since we are serializing "into a string", and I'm assuming that means a valid UTF-8 string
        - ..._but_ it could still be fun to do a binary encoding
    - avoid allocating where we can
        - should be able to use slices from original input
- error messages should be informative
    - we want to be able to tell the user where the stream became invalid

not an assumption, but personally I do not want to have to deal with string escaping. this means we should use an encoding that does not use terminators and instead includes the length of data explicitly.

## version 0
if we did a 1:1 translation of the Python class in the example to Rust, we get something like this:

```rust
#[derive(Debug, PartialEq)]
struct Node0<'a> {
    data: &'a str,
    left: Option<Box<Node<'a>>>,
    right: Option<Box<Node<'a>>>,
}
```

and let's implement some constructors

```rust

impl Node0<'_> {
    fn new_full<'a>(data: &'a str, left: Node0<'a>, right: Node0<'a>) -> Node0<'a> {
        Node0 {
            data,
            left: Some(Box::new(left)),
            right: Some(Box::new(right)),
        }
    }

    fn new_left<'a>(data: &'a str, left: Node0<'a>) -> Node0<'a> {
        Node0 {
            data,
            left: Some(Box::new(left)),
            right: None,
        }
    }

    fn new_right<'a>(data: &'a str, right: Node0<'a>) -> Node0<'a> {
        Node0 {
            data,
            left: None,
            right: Some(Box::new(right)),
        }
    }

    fn new_leaf<'a>(data: &'a str) -> Node0<'a> {
        Node0 {
            data,
            left: None,
            right: None,
        }
    }
}

```

a straightforward encoding could be:
```
D<length><data>[L<node>][R<node>];
```

for the example given, we'd encode it as this:
```
D4rootLD4leftLD9left.leftRD5right
```

let's write a test to make sure we can get this out

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize() {
        let input = Node0::new_full(
            "root",
            Node0::new_left("left", Node0::new_leaf("left.left")),
            Node0::new_leaf("right"),
        );
        let expect = String::from("D4rootLD4leftLD9left.leftRD5right");
        let result = input.serialize_to_string();
        assert_eq!(expect, result);
    }
}
```

and we can make it pass with this implementation

```rust
impl Node0<'_> {
    fn serialize_to_string(&self) -> String {
        let mut buf = String::new();
        buf += "D";
        buf += &self.data.len().to_string();
        buf += self.data;

        if let Some(l) = &self.left {
            buf += "L";
            buf += &l.serialize_to_string();
        }

        if let Some(r) = &self.right {
            buf += "R";
            buf += &r.serialize_to_string();
        }

        buf
    }
}
```


### what about if we wanted to stream it?

right now we have to build up the whole dang serialization in memory. if we're just gonna write it to the wire anyway, that's wasteful. what would it look like to stream it instead?

```rust
impl Node0<'_> {
    fn serialize_to_string(&self) -> String {
        let mut buf = BufWriter::new(Vec::new());
        self.serialize(&mut buf);

        // safe: we will never have a problem flushing the buffer
        let bytes = buf.into_inner().unwrap();

        // safe: we know we have valid UTF-8 bytes
        String::from_utf8(bytes).unwrap()
    }

    fn serialize(&self, w: &mut impl io::Write) -> Result<(), io::Error> {
        w.write_all("D".as_bytes())?;
        w.write_all(&self.data.len().to_string().as_bytes());
        w.write_all(self.data.as_bytes());

        if let Some(l) = &self.left {
            w.write_all("L".as_bytes());
            l.serialize(w);
        }

        if let Some(r) = &self.right {
            w.write_all("R".as_bytes());
            r.serialize(w);
        }

        Ok(())
    }
}
```

### deserializing

let's drop in a test and make sure we can go back:

```rust
#[test]
fn test_deserialize() {
    let expect = Node0::new_full(
        "root",
        Node0::new_left("left", Node0::new_leaf("left.left")),
        Node0::new_leaf("right"),
    );
    let input = &expect.serialize_to_string();
    let result = Node0::deserialize(input).unwrap();
    assert_eq!(expect, result);
}
```

we're gonna implement this quick and dirty because I don't actually like this encoding, and I'll get into why in a bit, don't you worry.

```rust

impl Node0<'_> {
    fn deserialize(input: &'_ str) -> Result<Node0<'_>, String> {
        Self::_inner_deserialize(input, &mut 0)
    }

    fn _inner_deserialize<'a>(input: &'a str, i: &mut usize) -> Result<Node0<'a>, String> {
        // note: this function does all its own bookkeeping which sucks,
        // we can create a `Parser` struct in the next version so we don't
        // have to do that but for now just deal with it.

        let bytes = input.as_bytes();

        // read the data block header
        let c = char::from(bytes[*i]);
        if c != 'D' {
            return Err(format!("unexpected block at pos {i}: {c}"));
        } else {
            *i += 1;
        }
        let mut length = String::from("");
        loop {
            let c = char::from(bytes[*i]);
            if !c.is_digit(10) {
                break;
            }
            length.push(c);
            *i += 1;
        }

        // convert the length to an integer
        // safe: we only accepted digits above
        let length = length.parse::<usize>().expect("invalid length");

        // grab the data as a string slice
        let start = *i;
        let end = *i + length;
        let data = std::str::from_utf8(&bytes[start..end]).expect("invalid data: not utf8");

        *i = end;

        let mut left: Option<Box<Node0>> = None;
        let mut right: Option<Box<Node0>> = None;
        loop {
            match char::from(bytes[*i]) {
                ';' => {
                    *i += 1;
                    break;
                }
                'L' => {
                    *i += 1;
                    left = Some(Box::new(Node0::_inner_deserialize(input, i)?));
                }
                'R' => {
                    *i += 1;
                    right = Some(Box::new(Node0::_inner_deserialize(input, i)?));
                }
                _ => {
                    return Err(format!("unexpected bullshit at pos {i}: {c}"));
                }
            }
        }
        return Ok(Node0 { data, left, right });
    }
}
```

and this should pass the tests. before we spend too much time improving the implementation, let's look at how this encoding falls short.

### whoops it blows up

round-trip function pairs like `serialize/deserialize` are perfect candidates for property-based testing. let's `cargo add proptest` and see if we can find any problems.

```rust
#[cfg(test)]
mod tests {
    proptest! {
        #[test]
        fn test_deserialize_arbitrary(d1: String, d2: String, d3: String, d4: String) {
            let expect = Node0::new_full(
                &d1,
                Node0::new_left(&d2, Node0::new_leaf(&d3)),
                Node0::new_leaf(&d4),
            );
            let input = &expect.serialize_to_string();
            let result = Node0::deserialize(input).unwrap();
            assert_eq!(expect, result);
        }
    }
}
```

whoops

```
---- tests::test_deserialize_arbitrary stdout ----
thread 'tests::test_deserialize_arbitrary' panicked at 'range end index 1322 out of range for slice of length 73', src/bin/problem-0003.rs:533:41
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
thread 'tests::test_deserialize_arbitrary' panicked at 'range end index 1321 out of range for slice of length 72', src/bin/problem-0003.rs:533:41
thread 'tests::test_deserialize_arbitrary' panicked at 'range end index 1319 out of range for slice of length 70', src/bin/problem-0003.rs:533:41
...
thread 'tests::test_deserialize_arbitrary' panicked at 'range end index 19 out of range for slice of length 16', src/bin/problem-0003.rs:533:41
proptest: Saving this and future failures in /Users/brian/src/personal/dcp/proptest-regressions/bin/problem-0003.txt
proptest: If this test was run on a CI system, you may wish to add the following line to your copy of the file. (You may need to create it.)
cc d125c2910470d34262ff4997aef04ecda52e7d81876ec2f35822b3c4d8a520c2
thread 'tests::test_deserialize_arbitrary' panicked at 'Test failed: called `Result::unwrap()` on an `Err` value: "unexpected bullshit at pos 13: D".
minimal failing input: d1 = "0", d2 = "", d3 = "", d4 = ""
	successes: 16
	local rejects: 0
	global rejects: 0
```

it's fun to see the shrinking in action as `proptest` searches for the minimal reproduction.

if we construct this tree manually and serialize, we get

```
D10LD0LD0;;RD0;;
```

and the problem jumps out: the top node has a length of `1` but it _looks_ like `10`. we can fix this by adding a non-digit terminator to the length block, something like `D<len>.<data>`.

```rust
// in `serialize`, after writing the length
w.write_all(".".as_bytes())?;
```

```rust
// in `_inner_deserialize`, after the length loop
let c = char::from(bytes[*i]);
if c != '.' {
    return Err(format!("expected len terminated by `.` at {i}; got {c}"));
}
*i += 1;
```

which would give us the following for the failing test:

```
D1.0LD0.LD0.;;RD0.;;
```

and if we make that change to the encoding, we're good to go, our property test passes.

### it doesn't spark joy

I don't like having to include these terminators! not the `.` for marking the end of a length, and not the `;` for marking the end of the node. how do we get around that? let's leave the length for now and look at getting rid of those `;` terminators.

## version 1

we can represent `Node` as one of four variants:
```rust
enum Node1<'a> {
    Leaf(&'a str),
    Left(&'a str, Box<Node1<'a>>),
    Right(&'a str, Box<Node1<'a>>),
    Full(&'a str, Box<Node1<'a>>, Box<Node1<'a>>),
}
```

if we know which variant we're dealing with ahead of time, we don't need a terminator—we'll know whether we're looking for 0, 1, or 2 nodes from the outset. let's include the variant tag in the encoding. I'm gonna start using eBNF (kinda) here because why not.

```ebnf
data = ? any character ?

length = digit+

header = length , "." , data

node = "LEAF"  , header
     | "LEFT"  , header , node
     | "RIGHT" , header , node
     | "FULL"  , header , node , node
```

let's implement it

```rust
impl Node1<'_> {
    fn data(&self) -> &str {
        match self {
            Node1::Leaf(v) | Node1::Full(v, _, _) | Node1::Left(v, _) | Node1::Right(v, _) => v,
        }
    }

    fn serialize_to_string(&self) -> String {
        let mut buf = BufWriter::new(Vec::new());
        self.serialize(&mut buf);

        // safe: we will never have a problem flushing the buffer
        let bytes = buf.into_inner().unwrap();

        // safe: we know we have valid UTF-8 bytes
        String::from_utf8(bytes).unwrap()
    }

    fn serialize(&self, w: &mut impl io::Write) -> Result<(), io::Error> {
        match self {
            Node1::Leaf(_) => {
                w.write_all("LEAF".as_bytes());
                self.serialize_data(w)?;
            }
            Node1::Left(_, l) => {
                w.write_all("LEFT".as_bytes());
                self.serialize_data(w)?;
                l.serialize(w);
            }
            Node1::Right(_, r) => {
                w.write_all("LEFT".as_bytes());
                self.serialize_data(w)?;
                r.serialize(w);
            }
            Node1::Full(_, l, r) => {
                w.write_all("FULL".as_bytes());
                self.serialize_data(w)?;
                l.serialize(w);
                r.serialize(w);
            }
        }
        Ok(())
    }

    fn serialize_data(&self, w: &mut impl io::Write) -> Result<(), io::Error> {
        w.write_all(&self.data().len().to_string().as_bytes());
        w.write_all(".".as_bytes())?;
        w.write_all(self.data().as_bytes());
        Ok(())
    }

    fn new_full<'a>(val: &'a str, left: Node1<'a>, right: Node1<'a>) -> Node1<'a> {
        Node1::Full(val, Box::new(left), Box::new(right))
    }

    fn new_left<'a>(val: &'a str, left: Node1<'a>) -> Node1<'a> {
        Node1::Left(val, Box::new(left))
    }

    fn new_right<'a>(val: &'a str, right: Node1<'a>) -> Node1<'a> {
        Node1::Right(val, Box::new(right))
    }

    fn new_leaf<'a>(val: &'a str) -> Node1<'a> {
        Node1::Leaf(val)
    }
}
```


and if we run our original example through, we get this serialization

```
FULL4.rootLEFT4.leftLEAF9.left.leftLEAF5.right
```


### but this makes it a little annoying to parse

we have to look at 4 or 5 bytes to know which tag we have. not only is that more than 1 byte, it's a _variable_ number of bytes.

we can do better: if we're willing to sacrifice a lot of human readability, we can use an integer as the tag ID and only have to read a single byte.

whether this tradeoff is worth it entirely depends on why we're writing this to begin with, but I'm going somewhere with this so I'm gonna do it.

```rust
fn serialize(&self, w: &mut impl io::Write) -> Result<(), io::Error> {
    match self {
        Node1::Leaf(_) => {
            w.write_all("1".as_bytes());
            self.serialize_data(w)?;
        }
        Node1::Left(_, l) => {
            w.write_all("2".as_bytes());
            self.serialize_data(w)?;
            l.serialize(w);
        }
        Node1::Right(_, r) => {
            w.write_all("3".as_bytes());
            self.serialize_data(w)?;
            r.serialize(w);
        }
        Node1::Full(_, l, r) => {
            w.write_all("4".as_bytes());
            self.serialize_data(w)?;
            l.serialize(w);
            r.serialize(w);
        }
    }
    Ok(())
}
```

which gives us the following as the serializing of the example

```
44.root24.left19.left.left15.right
```

let's try to parse this, and let's make a little helper so we don't have to do so much bookkeeping

```rust
struct Parser<'a> {
    bytes: &'a [u8],
    length: usize,
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Parser<'a> {
        let bytes = input.as_bytes();
        Parser {
            bytes,
            length: bytes.len(),
            pos: 0,
        }
    }

    fn current_char(&self) -> char {
        debug_assert!(
            self.pos < self.length,
            "parser position out of bounds: {} >= {}",
            self.pos,
            self.length
        );
        char::from(self.bytes[self.pos])
    }

    fn next(&mut self) -> Option<char> {
        if self.pos >= self.length {
            return None;
        }
        let c = self.current_char();
        self.pos += 1;
        Some(c)
    }

    fn next_digit(&mut self) -> Option<char> {
        if self.pos >= self.length {
            return None;
        }
        let c = self.current_char();

        if !c.is_digit(10) {
            return None;
        }

        self.pos += 1;
        Some(c)
    }

    fn expect(&mut self, expected: char) -> Option<char> {
        if self.pos >= self.length {
            return None;
        }
        let c = self.current_char();
        if c != expected {
            return None;
        }
        self.pos += 1;
        Some(c)
    }

    fn into_node(mut self) -> Result<(Node1<'a>, Parser<'a>), String> {
        let tag = match self.next() {
            Some(c) if c.is_ascii_digit() && c >= '1' && c <= '4' => c,

            Some(c) => {
                return Err(format!("expected tag, got {} at position {}", c, self.pos));
            }
            None => return Err(format!("expected tag, got EOF at position {}", self.pos)),
        };

        let length = {
            let mut digits = String::new();
            while let Some(d) = self.next_digit() {
                digits.push(d);
            }
            if let None = self.expect('.') {
                return Err(format!(
                    "expected length to be terminated by '.' at pos {}",
                    self.pos
                ));
            }
            digits.parse::<usize>().expect("didn't get a valid length")

        };

        let data = {
            let start = self.pos;
            let end = self.pos + length;
            self.pos = self.pos + length;

            if end > self.length {
                return Err(format!(
                    "invalid length reading from pos {}: reading {length} would overflow (total input length: {})",
                    self.pos, self.length
                ));
            }

            match std::str::from_utf8(&self.bytes[start..end]) {
                Ok(data) => data,
                Err(error) => {
                    return Err(format!(
                        "could not create valid utf-8 out of slice [{start}..{end}]: {error}"
                    ))
                }
            }
        };

        let this = self;
        match tag {
            '1' /* leaf */ => Ok((Node1::new_leaf(data), this)),
            '2' /* left */ => {
                let (left, this) = this.into_node()?;
                Ok((Node1::new_left(data, left), this))
            },
            '3' /* right */ => {
                let (right, this) = this.into_node()?;
                Ok((Node1::new_left(data, right), this))
            },
            '4' /* full */ => {
                let (left, this) = this.into_node()?;
                let (right, this) = this.into_node()?;
                Ok((Node1::new_full(data, left, right), this))
            },
            _ => Err(format!("unknown tag: {tag}")),
        }
    }
}
```

and with this our deserialize function is pretty straightforward

```rust
impl Node1<'_> {
    fn deserialize(input: &'_ str) -> Result<Node1<'_>, String> {
        let mut p = Parser::new(input);
        let (node, _) = p.into_node()?;
        Ok(node)
    }
}
```

we can copy over our `Node0` deserializer tests and see this still works.

### touch fuzzy get dizzy

let's add a new `proptest` block that'll act like a gentle fuzzer, just a soupçon of fuzz

```rust
proptest! {
    #![proptest_config(ProptestConfig {
        cases: 10000, .. ProptestConfig::default()
    })]
    #[test]
    fn test_deserialize_fuzz(input: String) {
        // shouldn't crash
        Node1::deserialize(&input);
    }
}
```

I ran this and it found something after about 3000 inputs:

```
thread 'node1_tests::test_deserialize_fuzz' panicked at 'Test failed: didn't get a valid length: ParseIntError { kind: Empty }.
minimal failing input: input = "1."
	successes: 3867
	local rejects: 0
	global rejects: 0
```

so we read the tag, then read the length—but we didn't make sure we actually read any digits. we get the `.` and then blow up when we try to parse the empty digit string. let's fix that by making sure we got _something_, and returning an `Err` if we didn't.

```rust
if digits.len() == 0 {
    return Err(format!(
        "expected length after tag, could not read any digits at pos {}",
        self.pos
    ));
}
```

I jacked the config up to a million cases and let it run for a while and it didn't find any more problems just spitting entirely random strings at it.

property-based testing is great at reducing test cases once it finds a failing case, but it's not particularly smart at actually _finding_ a failing cases. for types with edges or  _interesting_ values, it will poke around those (e.g. `0, -1, u8::MAX, u8::MIN`), but for a string that represents a serialization, it will struggle to get deep into parser states.

actual fuzzers are a bit smarter, and can run the test with some trash, look at the code coverage, and see if it changed since the last run. this helps it figure out if its on the right track or not, and prevents it from flailing randomly all over the state space.

we'll get back to fuzzing, but first lets complain about this encoding a little bit.

### I still don't like that length terminator
