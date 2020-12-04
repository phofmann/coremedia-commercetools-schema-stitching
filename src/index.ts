import { getAuthToken } from "./commercetools-auth";
import makeRemoteExecutor from "./makeRemoteExecutor";

import {
  introspectSchema,
  RenameRootFields,
  RenameTypes,
  wrapSchema,
} from "@graphql-tools/wrap";
import { stitchSchemas } from "@graphql-tools/stitch";
import { delegateToSchema } from "@graphql-tools/delegate";
import * as dotenv from "dotenv";

import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLResolveInfo } from "graphql";

async function makeGatewaySchema() {
  dotenv.config();
  const coreMediaSchemaPrefix = process.env.COREMEDIA_SCHEMA_PREFIX || "";
  const coremediaSchema = makeRemoteExecutor(
    process.env.COREMEDIA_ENDPOINT || "https://localhost:41080/graphql"
  );

  const headers = await getAuthToken();
  const ctSchema = makeRemoteExecutor(
    process.env.CT_API_HOST + "/" + process.env.CT_PROJECT_KEY + "/graphql",
    {
      "Content-Type": "application/json",
      Authorization: headers,
    }
  );

  const linkSchemaDefs = `
        extend type ${coreMediaSchemaPrefix}CMExternalChannelImpl {
            ctCategory: Category
        }
        extend type ${coreMediaSchemaPrefix}CMExternalProductImpl {
            ctProduct: Product
        }
        extend type ${coreMediaSchemaPrefix}CMProductTeaserImpl {
            ctProduct: Product
        }
        extend type Category {
          augmentation: ${coreMediaSchemaPrefix}CMExternalChannelImpl
        }
  `;
  const wrappedCtSchema = wrapSchema({
    schema: await introspectSchema(ctSchema),
    executor: ctSchema,
  });
  const wrappedCoreMediaSchema = wrapSchema({
    schema: await introspectSchema(coremediaSchema),
    executor: coremediaSchema,
  });

  const resolvers = {
    CM_CMExternalChannelImpl: {
      ctCategory: {
        selectionSet: `{ externalId }`,
        resolve(
          cmExternalCategory,
          args: Record<string, string>,
          context: Record<string, string>,
          info: GraphQLResolveInfo
        ) {
          const externalId = cmExternalCategory.externalId.substr(
            "ct:///catalog/category/".length,
            cmExternalCategory.externalId.length
          );
          return delegateToSchema({
            schema: wrappedCtSchema,
            operation: "query",
            fieldName: "category",
            args: { key: externalId },
            context,
            info,
          });
        },
      },
    },
    CM_CMExternalProductImpl: {
      ctProduct: (
        cmExternalProduct: any,
        args: Record<string, any>,
        context: Record<string, any>,
        info: GraphQLResolveInfo
      ) => {
        const externalId = cmExternalProduct.externalId.substr(
          "ct:///catalog/product/".length,
          cmExternalProduct.externalId.length
        );
        return delegateToSchema({
          schema: wrappedCtSchema,
          operation: "query",
          fieldName: "product",
          args: {
            id: externalId,
          },
          context: context,
          info: info,
        });
      },
    },
    CM_CMProductTeaserImpl: {
      ctProduct: (
        cmProductTeaser: any,
        args: Record<string, any>,
        context: Record<string, any>,
        info: GraphQLResolveInfo
      ) => {
        const externalId = cmProductTeaser.externalId.substr(
          "ct:///catalog/product/".length,
          cmProductTeaser.externalId.length
        );
        return delegateToSchema({
          schema: wrappedCtSchema,
          operation: "query",
          fieldName: "product",
          args: {
            id: externalId,
          },
          context: context,
          info: info,
        });
      },
    },
  };

  return stitchSchemas({
    subschemas: [
      {
        schema: wrappedCtSchema,
        executor: ctSchema,
      },
      {
        schema: wrappedCoreMediaSchema,
        executor: coremediaSchema,
        transforms: [
          new RenameTypes((type) => `${coreMediaSchemaPrefix}${type}`),
          new RenameRootFields(
            (operation, name) => `${coreMediaSchemaPrefix}${name}`
          ),
        ],
      },
    ],
    resolvers: resolvers,
    typeDefs: linkSchemaDefs,
  });
}

makeGatewaySchema().then((schema) => {
  const app = express();
  app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));
  app.listen(4000, () =>
    console.log("gateway running at http://localhost:4000/graphql")
  );
});
