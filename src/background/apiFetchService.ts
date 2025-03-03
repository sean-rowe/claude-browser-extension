export async function fetchChatData(details) {
    const headers = details.requestHeaders.reduce((acc, h) => {
        acc[h.name] = h.value;
        return acc;
    }, {});

    headers["X-Own-Request"] = "true";

    const resp = await fetch(details.url, {
        method: details.method,
        headers,
        credentials: "include",
    });

    return resp.ok ? resp.json() : null;
}
