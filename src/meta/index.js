export let title = "brianloveswords";
export let description = "thoughts and feelings";
export let baseURL = "https://bjb.dev";

if (process.env.NODE_ENV === "dev") {
    baseURL = "";
}
