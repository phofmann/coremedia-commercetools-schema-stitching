import { fetch } from "cross-fetch";
import { print } from "graphql";

// Builds a remote schema executor function,
// customize any way that you need (auth, headers, etc).
// Expects to recieve an object with "document" and "variable" params,
// and asynchronously returns a JSON response from the remote.
function makeRemoteExecutor(url: string, headers?: HeadersInit) {
  console.log(
    "Opening connection for " +
      url +
      " with headers: " +
      JSON.stringify(headers)
  );
  return async ({ document, variables }) => {
    const query = typeof document === "string" ? document : print(document);
    const fetchResult = await fetch(url, {
      method: "POST",
      headers: headers ? headers : { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return fetchResult.json();
  };
}

export default makeRemoteExecutor;
