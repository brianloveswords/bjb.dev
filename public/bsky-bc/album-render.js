const PAGE_SIZE = 500;

function renderAlbum(album, { allTags, container, headerTitle, headerTags }) {
  const cleanTags = album.tags.map((s) => s.trim().toLowerCase());

  for (const tag of cleanTags) {
    allTags.add(tag);
  }

  function showDetails() {
    headerTitle.textContent = album.title;
    headerTags.textContent = cleanTags.join(", ");
  }

  const item = document.createElement("a");
  item.href = album.uri;
  item.className = "item";
  item.dataset.filterTags = cleanTags.map((s) => `[${s}]`).join(" ");
  item.dataset.filterTitle = album.title.toLowerCase();
  item.addEventListener("focus", showDetails);
  item.addEventListener("mouseover", showDetails);

  const img = document.createElement("img");
  img.src = album.imageHref;
  img.loading = "lazy";
  img.className = "artwork";
  item.appendChild(img);

  const embed = createEmbed(album);
  embed.addEventListener("focus", showDetails);

  function replacer(e) {
    e.preventDefault();

    if (e.shiftKey) {
      window.open(album.uri, "_blank");
      return;
    }

    item.replaceChild(embed, img);
  }

  item.addEventListener("click", replacer, { once: true });

  container.appendChild(item);
}

function renderNextPage(remaining, config) {
  if (remaining.length === 0) {
    return;
  }

  const current = remaining.slice(0, PAGE_SIZE);
  for (const album of current) {
    renderAlbum(album, config);
  }

  const nextPage = remaining.slice(PAGE_SIZE);
  if (nextPage.length === 0) {
    return;
  }

  setTimeout(() => {
    requestAnimationFrame(() => {
      renderNextPage(nextPage, config);
    });
  }, 333);
}

function main() {
  const mainList = document.getElementById("main");
  const tagList = document.getElementById("tags");
  const tagFilter = document.getElementById("tag-filter");
  const tagFilterStyle = document.getElementById("tag-filter-style");
  const titleFilter = document.getElementById("title-filter");
  const titleFilterStyle = document.getElementById("title-filter-style");
  const headerTitle = document.getElementById("header-item-title");
  const headerTags = document.getElementById("header-item-tags");
  const infoLastUpdated = document.getElementById("last-updated");

  const allTags = new Set();

  // update lateUpdated
  infoLastUpdated.textContent = new Date(GLOBAL.lastUpdated).toLocaleString();

  // build the main album list
  renderNextPage(GLOBAL.albums, {
    allTags,
    container: mainList,
    headerTitle,
    headerTags,
  });

  // build tag list
  const sortedTags = Array.from(allTags).sort();
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

  setInitialFilterFromUrlParams(tagFilter);

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

function setInitialFilterFromUrlParams(input) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const tags = params.get("tags");

  if (!tags) {
    return;
  }

  input.value = tags;
  input.dispatchEvent(new Event("input"));
}

function createEmbed(album) {
  const iframe = document.createElement("iframe");
  iframe.className = "embed";
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
