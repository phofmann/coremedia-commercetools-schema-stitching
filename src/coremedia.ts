import {
  introspectSchema,
  makeRemoteExecutableSchema,
  RenameRootFields,
  RenameTypes,
  transformSchema,
} from "graphql-tools";
import { createHttpLink } from "apollo-link-http";
import fetch from "cross-fetch";
import { ApolloLink, from } from "apollo-link";
import { createPersistedQueryLink } from "apollo-link-persisted-queries";

const httpLink = () => {
  return createHttpLink({
    uri: process.env.COREMEDIA_ENDPOINT || "https://localhost:41080/graphql",
    fetch: customFetch,
    fetchOptions: {},
  });
};

// Kill CORS Preflight Requests - nobody needs a content-type header for GET:
const customFetch = (uri: any, options: any) => {
  if (options.method === "GET") {
    // eslint-disable-next-line no-param-reassign
    delete options.headers["content-type"];
  }
  return fetch(uri, options);
};


const getCoreMediaSchema = async (prefix?: string) => {
  const link: ApolloLink = httpLink();
  const schema = await introspectSchema(link);

  const graphQLSchema = makeRemoteExecutableSchema({
    schema: schema,
    link,
  });

  if (prefix) {
    return transformSchema(graphQLSchema, [
      new RenameTypes((type) => `${prefix}${type}`),
      new RenameRootFields((operation, name) => `${prefix}${name}`),
    ]);
  }
  return graphQLSchema;
};

export default getCoreMediaSchema;
