import { introspectSchema, makeRemoteExecutableSchema } from "graphql-tools";
import { createHttpLink } from "apollo-link-http";
import fetch from "cross-fetch";
import { setContext } from "apollo-link-context";
import { getAuthToken } from "./commercetools-auth";

// Kill CORS Preflight Requests - nobody needs a content-type header for GET:
const customFetch = (uri: any, options: any) => {
  if (options.method === "GET") {
    // eslint-disable-next-line no-param-reassign
    delete options.headers["content-type"];
  }
  return fetch(uri, options);
};

const authLink = setContext((_, { headers = {} }) =>
  getAuthToken().then(function (authorization: string) {
    return {
      headers: {
        ...headers,
        authorization,
      },
    };
  })
);

const ctHttpLink = () => {
  return createHttpLink({
    uri: `${process.env.CT_API_HOST}/${process.env.CT_PROJECT_KEY}/graphql`,
    fetch: customFetch,
    fetchOptions: {},
  });
};

const createLink = () => {
  return authLink.concat(ctHttpLink());
};

const getCommercetoolsSchema = async () => {
  const link = createLink();
  const schema = await introspectSchema(link);

  return makeRemoteExecutableSchema({
    schema,
    link,
  });
};

export default getCommercetoolsSchema;
