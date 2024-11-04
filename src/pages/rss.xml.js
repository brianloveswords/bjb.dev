import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt({ html: true });

export async function GET(context) {
  const posts = await getCollection("log");
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      ...post.data,
      content: sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "details",
          "summary",
          "iframe",
        ]),
        allowedIframeHostnames: [
          "www.youtube.com",
          "www.youtube-nocookie.com",
          "bandcamp.com",
          "*",
        ],
        allowedAttributes: {
          img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
          iframe: [
            "src",
            "width",
            "height",
            "frameborder",
            "allow",
            "title",
            "allowfullscreen",
          ],
        },
      }),
      link: `/log/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
