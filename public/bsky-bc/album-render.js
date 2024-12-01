const mainList = document.getElementById("main");
const tagList = document.getElementById("tags");
const tagFilter = document.getElementById("tag-filter");
const tagFilterStyle = document.getElementById("tag-filter-style");
const titleFilter = document.getElementById("title-filter");
const titleFilterStyle = document.getElementById("title-filter-style");
const headerTitle = document.getElementById("header-item-title");
const headerTags = document.getElementById("header-item-tags");
const infoLastUpdated = document.getElementById("last-updated");

const ITEM_SIZE = 200; //px
const PAGE_SIZE = 500;

function processAlbum(album, tags) {
  const cleanTags = album.tags.map((s) => s.trim().toLowerCase());

  for (const tag of cleanTags) {
    tags.add(tag);
  }

  function showDetails() {
    headerTitle.textContent = album.title;
    headerTags.textContent = cleanTags.join(", ");
  }

  const container = document.createElement("a");
  container.href = album.uri;
  container.className = "item";
  container.dataset.filterTags = cleanTags.map((s) => `[${s}]`).join(" ");
  container.dataset.filterTitle = album.title.toLowerCase();
  container.addEventListener("focus", showDetails);
  container.addEventListener("mouseover", showDetails);

  const img = document.createElement("img");
  img.src = album.imageHref;
  img.loading = "lazy";
  img.style = `width: ${ITEM_SIZE}px; height: ${ITEM_SIZE}px;`;
  container.appendChild(img);

  const embed = createEmbed(album);
  embed.addEventListener("focus", showDetails);

  function replacer(e) {
    e.preventDefault();

    if (e.shiftKey) {
      window.open(album.uri, "_blank");
      return;
    }
    container.removeEventListener("click", replacer);
    container.replaceChild(embed, img);
  }

  container.addEventListener("click", replacer);

  mainList.appendChild(container);
}

function processInBatches(remaining, tags) {
  if (remaining.length === 0) {
    return;
  }

  const current = remaining.slice(0, PAGE_SIZE);
  const next = remaining.slice(PAGE_SIZE);
  for (const album of current) {
    processAlbum(album, tags);
  }

  setTimeout(() => {
    requestAnimationFrame(() => {
      processInBatches(next, tags);
    });
  }, 333);
}

function main() {
  const tags = new Set();

  // update lateUpdated
  infoLastUpdated.textContent = new Date(GLOBAL.lastUpdated).toLocaleString();

  // build the main album list
  processInBatches(GLOBAL.albums, tags);

  // build tag list
  const sortedTags = Array.from(tags).sort();
  for (const tag of sortedTags) {
    const option = document.createElement("option");
    option.value = tag;
    tagList.appendChild(option);
  }

  // enable the tag filter
  tagFilter.addEventListener("input", (e) => {
    const value = e.target.value.trim();

    if (!value) {
      tagFilterStyle.textContent = "";
      return;
    }

    const selectorBody = value
      .split(",")
      .map((s) => `[data-filter-tags*="${s.trim()}"]`)
      .join("");
    const selector = `.item:not(${selectorBody})`;
    const content = `display:none;`;
    const css = `${selector} { ${content} }`;
    tagFilterStyle.textContent = css;
  });

  setInitialFilterFromUrlParams();

  // enable the title filter
  titleFilter.addEventListener("input", (e) => {
    const value = e.target.value.trim();

    if (!value) {
      titleFilterStyle.textContent = "";
      return;
    }

    const selectorBody = value
      .split(/\s+/)
      .map((s) => `[data-filter-title*="${s.trim()}"]`)
      .join("");
    const selector = `.item:not(${selectorBody})`;
    const content = `display:none;`;
    const css = `${selector} { ${content} }`;
    titleFilterStyle.textContent = css;
  });
}

function setInitialFilterFromUrlParams() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const tags = params.get("tags");
  if (tags) {
    tagFilter.value = tags;
    tagFilter.dispatchEvent(new Event("input"));
  }
}

function createEmbed(album) {
  const iframe = document.createElement("iframe");
  iframe.style = `width: ${ITEM_SIZE}px; height: ${ITEM_SIZE}px;`;
  iframe.seamless = true;

  const baseHref = "https://bandcamp.com/EmbeddedPlayer";
  const params =
    "size=large/bgcol=333333/linkcol=0f91ff/minimal=true/transparent=true/";

  let id = "";
  if (album.albumId && album.trackId) {
    id = `album=${album.albumId}/track=${album.trackId}`;
  } else if (album.albumId) {
    id = `album=${album.albumId}`;
  } else if (album.trackId) {
    id = `track=${album.trackId}`;
  } else {
    throw new Error(
      `Invalid album data for '${album.uri}': missing albumId or trackId`,
    );
  }
  iframe.src = `${baseHref}/${id}/${params}`;
  return iframe;
}

main();
