export function cleanDate(date) {
    if (date?.constructor === Date) {
        date = date.toISOString().slice(0, 10);
    } else if (date.length > 10) {
        date = date.slice(0, 10);
    }
    return date;
}

export function getCanonicalURL(Astro) {
    if (process.env.NODE_ENV == "dev") {
        return "";
    } else {
        return Astro.request.canonicalURL;
    }
}
