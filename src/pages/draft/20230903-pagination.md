---
layout: ../../layouts/BlogPost.astro
title: how I consume paginated apis
description: lazily when it makes sense
publishDate: 2023-09-03
---

playing with the [Zotero](https://zotero.org) API this weekend and as I'd expect it returns paginated data for most things.

using Scala, I'd typically make a client that returns [`fs2.Stream[IO, A]`](https://fs2.io) for calls that return collections of items. fs2 streams are really nice because they produce data lazily and have a rich set of combinators that work well for my how my brain thinks about programming (input -> transformations -> output). I used fs2 streams all the time when I was doing data engineering, and I miss them!

these days I'm trying to knock the iron oxide off my Rust chops, so I want to figure out how I get similar semantics, ergonomics, and performance out of what's available in the Rust ecosystem.

figure I might as well be comprehensive and start with the eager method, then work my way up to laziness.

## initial setup

let's make test server so we don't have to hammer a real API. this will also give me some practice setting up a little server in Rust.

```bash
cargo new --bin pagination
cd pagination

cargo add futures
cargo add tokio -F full,tracing
cargo add axum -F tracing
cargo add tracing
cargo add tracing_subscriber -F registry,env-filter
cargo add tracing-bunyan-formatter
cargo add tracing_unwrap -F log-location
cargo add reqwest -F json
cargo add serde -F derive
cargo add serde_json

# if you want to pretty print the logs
cargo install bunyan
```

let's do all the ceremony to get logging setup and test that it works

```rust
use std::{thread, time::Duration};

use tracing_bunyan_formatter::BunyanFormattingLayer;
use tracing_subscriber::{prelude::*, EnvFilter};

fn main() {
    setup_tracing("pagination".into());
    tracing::info!("helllooo");
    thread::sleep(Duration::from_secs(1));
    tracing::info!("see ya");
}

fn setup_tracing(name: String) {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let fmt_layer = BunyanFormattingLayer::new(name, std::io::stdout);
    let subscriber = tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt_layer);
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");
}
```

let's run it and see what we get

```bash
cargo run | tee logs.ndjson
```
```json
{"v":0,"name":"pagination","msg":"helllooo","level":30,"hostname":"macrosystem.local","pid":58442,"time":"2023-09-03T20:07:00.58112Z","target":"pagination","line":8,"file":"src/main.rs"}
{"v":0,"name":"pagination","msg":"see ya","level":30,"hostname":"macrosystem.local","pid":58442,"time":"2023-09-03T20:07:01.586613Z","target":"pagination","line":10,"file":"src/main.rs"}
```

and if you want to get that looking nice for the terminal, you can toss `| bunyan` at the end of the pipeline


```bash
cargo run | tee logs.ndjson | bunyan
```
```
[2023-09-03T20:07:00.581Z]  INFO: pagination/58442 on macrosystem.local: helllooo (file=src/main.rs,line=8,target=pagination)
[2023-09-03T20:07:01.586Z]  INFO: pagination/58442 on macrosystem.local: see ya (file=src/main.rs,line=10,target=pagination)
```

## aside: structured logging is great for development

I start using structured logs immediately when developing something, I don't wait until productionization. writing out logs as newline delimited JSON lets me easily process them with other tools and not have to `grep` as much, though I still do plenty of grepping.

I use [nushell](http://www.nushell.sh/) as my daily shell and it supports structured data, so if I have `logs.ndjson` I can do something like

```
open logs.ndjson | from json -o | where level >= 30 | get msg
```

when I need to do something particularly sophisticated, I use [duckdb](https://duckdb.org/) and write some analytical SQL:

```sql
-- query.sql

with base as (
    select
        msg,
        strptime(time, '%xT%X.%fZ') as ts,
    from read_json_auto('logs.ndjson')
)

select
    msg,
    ts,
    ts - lag(ts) over (order by ts) as delta,
from base;
```

```bash
duckdb <query.sql
```

```
┌──────────┬────────────────────────────┬─────────────────┐
│   msg    │             ts             │      delta      │
│ varchar  │         timestamp          │    interval     │
├──────────┼────────────────────────────┼─────────────────┤
│ helllooo │ 2023-09-03 20:08:27.031021 │                 │
│ see ya   │ 2023-09-03 20:08:28.315645 │ 00:00:01.284624 │
└──────────┴────────────────────────────┴─────────────────┘
```

## making a server

alright, we got something that [does nothing](https://devblogs.microsoft.com/oldnewthing/20230725-00/?p=108482), let's make something that does something.


```rust
// src/main.rs

use std::net::SocketAddr;

use axum::{extract::Query, http::StatusCode, routing, Json, Router};
use serde::{Deserialize, Serialize};
use tracing_bunyan_formatter::BunyanFormattingLayer;
use tracing_subscriber::{prelude::*, EnvFilter};
use tracing_unwrap::*;

#[tokio::main]
async fn main() {
    setup_tracing("pagination".into());

    let app = Router::new().route("/pages", routing::get(pages));
    let addr = SocketAddr::from(([127, 0, 0, 1], 4123));

    tracing::debug!(?addr, "listening on {addr}");

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .expect_or_log("Failed to bind server");
}

const PAGE_SIZE: u32 = 10;
const MAX_PAGE: u32 = 10;

#[tracing::instrument]
async fn pages(Query(params): Query<Params>) -> (StatusCode, Json<PageResponse>) {
    tracing::info!(?params, "Got request");

    let page = params.page.unwrap_or(1);
    if page > MAX_PAGE {
        tracing::warn!(page, "Page out of bounds");
        return (
            StatusCode::NOT_FOUND,
            Json(PageResponse {
                data: vec![],
                meta: PageMeta {
                    page,
                    next_page: None,
                },
            }),
        );
    }

    let next_page = if page < MAX_PAGE {
        Some(page + 1)
    } else {
        None
    };
    let page_base = page * PAGE_SIZE;
    let data = (page_base..page_base + PAGE_SIZE).collect();
    (
        StatusCode::OK,
        Json(PageResponse {
            data,
            meta: PageMeta { page, next_page },
        }),
    )
}

#[derive(Debug, Deserialize)]
struct Params {
    page: Option<u32>,
}

#[derive(Debug, Serialize)]
struct PageResponse {
    data: Vec<u32>,
    meta: PageMeta,
}

#[derive(Debug, Serialize)]
struct PageMeta {
    page: u32,
    next_page: Option<u32>,
}

fn setup_tracing(name: String) {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("debug"));
    let fmt_layer = BunyanFormattingLayer::new(name, std::io::stdout);
    let subscriber = tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt_layer);
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");
}
```

this sets up a fairly typical API response that includes the data and a separate structure having some metadata about the response and whether there are more pages to read.

## eager client

let's add a client and testing different strategies. we'll work in `bin/client.rs`, which we can run with `cargo run --bin client`.

once we add that file, we'll either have to specify `--bin pagination` to run our `main.rs`, or update `Cargo.toml`:

```diff
[package]
name = "pagination"
version = "0.1.0"
edition = "2021"
+ default-run = "pagination"
```

we'll keep that server running in the background or another terminal while we test out the clients.

first I wanna toss something together just to try out a little bit of `reqwest`

```rust
// bin/client.rs

// moved the common structs to lib.rs
use pagination::PageResponse;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let body = reqwest::get("http://localhost:4123/pages")
        .await?
        .json::<PageResponse>()
        .await?;

    println!("{body:?}");
    Ok(())
}
```
```
PageResponse { data: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], meta: PageMeta { page: 1, next_page: Some(2) } }
```

alright looks good. let's make a client that reads all the items from all the pages into one big ol' vec.

```rust
use std::error::Error;

// moved to lib.rs
use pagination::PageResponse;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let client = Client {
        base_url: "http://localhost:4123".into(),
    };

    let items = client.get_all_items().await?;

    println!("{items:?}");
    Ok(())
}

type Item = u32;

struct Client {
    base_url: String,
}
impl Client {
    async fn get_page(&self, page: u32) -> Result<PageResponse, Box<dyn Error>> {
        let url = format!("{}/pages?page={page}", self.base_url);
        let body = reqwest::get(&url).await?.json::<PageResponse>().await?;
        Ok(body)
    }
    async fn get_all_items(&self) -> Result<Vec<Item>, Box<dyn Error>> {
        let mut items = Vec::new();
        let mut page = 1;
        loop {
            let page_response = self.get_page(page).await?;
            items.extend(page_response.data);
            if page_response.meta.next_page.is_none() {
                break;
            }
            page += 1;
        }
        Ok(items)
    }
}
```
```
[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109]
```

straightfoward, gets the job done if we're dealing with small data and/or this isn't called that often.

when we're dealing with a _lot_ of data though, say `get_every_wikipedia_page()`, we probably don't want to jam it in one big 'ol vec like this.

## make the caller deal with it

we could always say "if you have less than 10TB of RAM, use the `get_page` method instead"

it'd be nicer to provide a method usable without infinite RAM and keep the semantics of (possibly) emitting all items without forcing the caller to do manual bookkeeping.

## channels

channels can usually be a decent solution for emitting things, let's see how using that API feels.

<details open>
<summary>tl;dr it doesn't feel very good</summary>

- I couldn't figure out how to make `get_all_items` work without being an `Arc<Self>`.
- there's a lot more bookkeeping than I would like
- client has to bring their own channel, complicates the API

```rust
use std::{
    error::Error,
    sync::{mpsc, Arc},
};

use pagination::PageResponse;
use tokio::task::JoinHandle;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let client = Client::new("http://localhost:4123".into());

    let buf_size = 15;

    let (tx, rx) = mpsc::sync_channel(buf_size);
    client.get_all_items(tx).await?;

    let mut items = Vec::with_capacity(buf_size);
    while let Ok(item) = rx.recv() {
        if items.len() >= buf_size {
            drop(rx);
            break;
        }
        items.push(item);
    }

    println!("{items:?}");
    Ok(())
}

type Item = u32;

struct Client {
    base_url: String,
}
impl Client {
    fn new(base_url: String) -> Arc<Self> {
        Arc::new(Self { base_url })
    }

    async fn get_page(&self, page: u32) -> Result<PageResponse, Box<dyn Error>> {
        let url = format!("{}/pages?page={page}", self.base_url);
        let body = reqwest::get(&url).await?.json::<PageResponse>().await?;
        Ok(body)
    }
    async fn get_all_items(
        self: Arc<Self>,
        tx: mpsc::SyncSender<Item>,
    ) -> Result<JoinHandle<()>, Box<dyn Error>> {
        let h = tokio::spawn(async move {
            let mut page = 1;
            loop {
                let page_response = match self.get_page(page).await {
                    Ok(page_response) => page_response,
                    Err(e) => {
                        println!("Error getting page {}: {}", page, e);
                        break;
                    }
                };
                for item in page_response.data {
                    if let Err(e) = tx.send(item) {
                        println!("Error sending item: {}", e);
                        break;
                    };
                }
                if page_response.meta.next_page.is_none() {
                    break;
                }
                page += 1;
            }
        });
        Ok(h)
    }
}
```


## futures::Stream

how about using [futures::Stream] instead?

```rust
use std::error::Error;

use futures::{stream, Stream, StreamExt};
use pagination::PageResponse;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let client = Client::new("http://localhost:4123".into());

    let items = client
        .get_all_items()
        .await
        .take(15)
        .collect::<Vec<_>>()
        .await;

    println!("{items:?}");
    Ok(())
}

type Item = u32;

struct Client {
    base_url: String,
}

impl Client {
    fn new(base_url: String) -> Self {
        Self { base_url }
    }

    async fn get_page(&self, page: u32) -> Result<PageResponse, Box<dyn Error>> {
        let url = format!("{}/pages?page={page}", self.base_url);
        let body = reqwest::get(&url).await?.json::<PageResponse>().await?;
        Ok(body)
    }

    async fn get_all_pages(&self) -> impl Stream<Item = Vec<Item>> + '_ {
        stream::unfold(Some(1), move |state| async move {
            let page = state?;
            // TODO: error handling
            let resp = self.get_page(page).await.ok()?;
            Some((resp.data, resp.meta.next_page))
        })
    }

    async fn get_all_items(&self) -> impl Stream<Item = Item> + '_ {
        self.get_all_pages().await.flat_map(stream::iter)
    }
}
```


</details>


- manual
    - return next URL to call
        - leaks state
- thunk
    - return a function that returns the next page and a function
        - not ergonomic
- channel
- stream
