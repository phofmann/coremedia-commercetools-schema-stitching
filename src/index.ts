import {getAuthToken} from "./commercetools-auth";
import makeRemoteExecutor from "./makeRemoteExecutor";

import {introspectSchema, RenameRootFields, RenameTypes, WrapQuery, wrapSchema,} from "@graphql-tools/wrap";
import {stitchSchemas} from "@graphql-tools/stitch";
import * as dotenv from "dotenv";

import express from "express";
import {graphqlHTTP} from "express-graphql";
import {resolvers} from "./resolvers";

const coreMediaSchemaPrefix = process.env.COREMEDIA_SCHEMA_PREFIX || "";
export const transforms = [
    new RenameTypes((type) => `${coreMediaSchemaPrefix}${type}`),
    new RenameRootFields(
        (operation, name) => `${coreMediaSchemaPrefix}${name}`
    ),
];

async function makeGatewaySchema() {
    dotenv.config();

    const coremediaSchema = makeRemoteExecutor(
        process.env.COREMEDIA_ENDPOINT || "http://localhost:41180/graphql"
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
          augmentation: ${coreMediaSchemaPrefix}CategoryImpl
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



    return stitchSchemas({
        subschemas: [
            {
                schema: wrappedCtSchema,
                executor: ctSchema,
            },
            {
                schema: wrappedCoreMediaSchema,
                executor: coremediaSchema,
                transforms: transforms,
            },
        ],
        resolvers: resolvers(wrappedCoreMediaSchema, wrappedCtSchema),
        typeDefs: linkSchemaDefs,
    });
}

makeGatewaySchema().then((schema) => {
    const app = express();
    app.use("/graphql", graphqlHTTP({schema, graphiql: true}));
    app.listen(4000, () =>
        console.log("gateway running at http://localhost:4000/graphql")
    );
});
