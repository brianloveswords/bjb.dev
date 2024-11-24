const mainList = document.getElementById("main");
const tagList = document.getElementById("tags");
const tagFilter = document.getElementById("tag-filter");
const tagFilterStyle = document.getElementById("tag-filter-style");
const headerTitle = document.getElementById("header-item-title");
const headerTags = document.getElementById("header-item-tags");
const infoLastUpdated = document.getElementById("last-updated");

const itemSize = 200; //px

function main() {
  const tags = new Set();

  // update lateUpdated
  infoLastUpdated.textContent = new Date(lastUpdated).toLocaleString();

  // build the main album list
  for (const album of albumData) {
    const cleanTags = album.tags.map((s) => s.trim());

    for (const tag of cleanTags) {
      tags.add(tag);
    }

    function showDetails() {
      headerTitle.textContent = album.title;
      headerTags.textContent = cleanTags.join(", ");
    }

    const container = document.createElement("div");
    container.className = "item";
    container.dataset.title = album.title;
    container.dataset.tags = cleanTags.map((s) => `[${s}]`).join(" ");

    container.addEventListener("mouseover", showDetails);
    container.addEventListener("focus", showDetails);

    const link = document.createElement("a");
    link.href = album.uri;
    container.appendChild(link);

    const img = document.createElement("img");
    img.src = album.imageHref;
    img.loading = "lazy";
    img.style = `width: ${itemSize}px; height: ${itemSize}px;`;
    link.appendChild(img);

    const embed = createEmbed(album);
    embed.addEventListener("focus", showDetails);
    link.addEventListener("focus", showDetails);

    link.addEventListener("click", (e) => {
      e.preventDefault();

      if (e.shiftKey) {
        window.open(album.uri, "_blank");
        return;
      }

      container.replaceChild(embed, link);
    });

    mainList.appendChild(container);
  }

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
      .map((s) => `[data-tags*="${s.trim()}"]`)
      .join("");
    const selector = `.item:not(${selectorBody})`;
    const content = `display:none;`;
    const css = `${selector} { ${content} }`;
    tagFilterStyle.textContent = css;
  });

  setInitialFilterFromUrlParams();
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
  iframe.style = `width: ${itemSize}px; height: ${itemSize}px;`;
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
