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

export function formatDate(date) {
    if (typeof date === "string") {
        if (canBeDate(date)) {
            return formatDate(new Date(date));
        } else {
            return date;
        }
    } else if (date.constructor === Date) {
        let y = date.getUTCFullYear();
        let m = zeroPad(date.getUTCMonth() + 1);
        let d = zeroPad(date.getUTCDate());
        let datePart = `${y}-${m}-${d}`;

        // let h = zeroPad(date.getUTCHours());
        // let min = zeroPad(date.getUTCMinutes());
        // let s = zeroPad(date.getUTCSeconds());
        // let timePart = `${h}:${min}:${s}`;

        return `${datePart}`;
    }
}

function canBeDate(dateString) {
    return !Number.isNaN(new Date(dateString).getFullYear());
}

export function zeroPad(n) {
    return n < 10 ? "0" + n : `${n}`;
}
