const PAGE_SIZE = 666;
const PAGE_DELAY = 111;

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

function renderAlbums(remaining, config, doneCallback) {
  const current = remaining.slice(0, PAGE_SIZE);
  for (const album of current) {
    renderAlbum(album, config);
  }

  const nextPage = remaining.slice(PAGE_SIZE);
  if (nextPage.length === 0) {
    doneCallback();
    return;
  }

  setTimeout(() => {
    requestAnimationFrame(() => {
      renderAlbums(nextPage, config, doneCallback);
    });
  }, PAGE_DELAY);
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
  const loadingIndicator = document.getElementById("loading-indicator");

  const allTags = new Set();

  setLastUpdated(GLOBAL.lastUpdated, infoLastUpdated);
  enableFilters({ tagFilter, tagFilterStyle, titleFilter, titleFilterStyle });
  renderAlbums(
    GLOBAL.albums,
    {
      allTags,
      container: mainList,
      headerTitle,
      headerTags,
    },
    () => {
      loadingIndicator.addEventListener(
        "animationiteration",
        () => loadingIndicator.remove(),
        { once: true },
      );
    },
  );
  createAutocomplete(allTags, { tagList });
}

function enableFilters({
  tagFilter,
  tagFilterStyle,
  titleFilter,
  titleFilterStyle,
}) {
  const filters = { tags: tagFilter, title: titleFilter };
  const styles = { tags: tagFilterStyle, title: titleFilterStyle };

  for (const key of Object.keys(filters)) {
    const filter = filters[key];
    filter.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      styles[key].textContent = generateFilterStyle(key, value);
    });
    filter.addEventListener("blur", (e) => {
      const value = e.target.value.trim();
      setQueryParam(key, value);
    });
    filter.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.target.blur();
      }
    });
    setInitialFilterFromUrlParams(key, filter);
  }
}

function setLastUpdated(date, element) {
  element.textContent = new Date(date).toLocaleString();
}

function createAutocomplete(allTags, { tagList }) {
  const sortedTags = Array.from(allTags).sort();
  for (const tag of sortedTags) {
    const option = document.createElement("option");
    option.value = tag;
    tagList.appendChild(option);
  }
}

function generateFilterStyle(key, value) {
  if (!value) {
    return "";
  }
  const selectorBody = value
    .split(/\s+/)
    .map((s) => `[data-filter-${key}*="${s.trim()}"]`)
    .join("");
  const selector = `.item:not(${selectorBody})`;
  const content = `display:none;`;
  return `${selector} { ${content} }`;
}

function setQueryParam(key, value) {
  const url = new URL(window.location);
  if (!value) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  window.history.replaceState(null, "", url.toString());
}

function setInitialFilterFromUrlParams(key, input) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const tags = params.get(key);

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
