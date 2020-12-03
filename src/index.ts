import { delegateToSchema, mergeSchemas } from "graphql-tools";
import { ApolloServer } from "apollo-server";
import getCoreMediaSchema from "./coremedia";
import getCommercetoolsSchema from "./commercetools";
import * as dotenv from "dotenv";

async function run() {
  const ctSchema = await getCommercetoolsSchema();
  const coreMediaSchemaPrefix = process.env.COREMEDIA_SCHEMA_PREFIX || "";
  const coreMediaSchema = await getCoreMediaSchema(coreMediaSchemaPrefix);

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
  `;
  const resolvers = {
    CM_CMExternalChannelImpl: {
      ctCategory: (
        cmExternalChannel: any,
        args: {},
        context: any,
        info: any
      ) => {
        const externalId = cmExternalChannel.externalId.substr(
          "commercetools:///catalog/category/".length,
          cmExternalChannel.externalId.length
        );
        return delegateToSchema({
          schema: ctSchema,
          operation: "query",
          fieldName: "category",
          args: {
            id: externalId,
          },
          context: context,
          info: info,
        });
      },
    },
    CM_CMExternalProductImpl: {
      ctProduct: (
        cmExternalProduct: any,
        args: {},
        context: any,
        info: any
      ) => {
        const externalId = cmExternalProduct.externalId.substr(
          "commercetools:///catalog/product/".length,
          cmExternalProduct.externalId.length
        );
        return delegateToSchema({
          schema: ctSchema,
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
      ctProduct: (cmProductTeaser: any, args: {}, context: any, info: any) => {
        const externalId = cmProductTeaser.externalId.substr(
          "commercetools:///catalog/product/".length,
          cmProductTeaser.externalId.length
        );
        return delegateToSchema({
          schema: ctSchema,
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

  const schema = mergeSchemas({
    schemas: [ctSchema, coreMediaSchema, linkSchemaDefs],
    resolvers: resolvers,
  });

  const server = new ApolloServer({
    schema: schema,
    playground: {
      settings: {
        "editor.theme": "dark",
      },
      tabs: [
        {
          endpoint: "",
          name: "Page by Segment",
          query: `query PageQuery($path: String!) {
  CM_content {
    pageByPath(path: $path) {
      grid {
        cssClassName
        rows {
          placements {
            items {
              ...ExternalChannel
              ...ExternalProduct
              ...ExternalProductTeaser
              ...Teasable
            }
          }
        }
      }
    }
  }
}

fragment ExternalProductTeaser on CM_CMProductTeaserImpl {
  id
  externalId
  ctProduct {
    ...CTProduct
  }
}

fragment ExternalProduct on CM_CMExternalProductImpl {
  id
  externalId
  ctProduct {
    ...CTProduct
  }
}

fragment ExternalChannel on CM_CMExternalChannelImpl {
  id
  externalId
  segment
  ctCategory {
    ...CTCategory
  }
}

fragment CTProduct on Product {
  id
  version
  masterData {
    current {
      name(locale: "en")
      nameAllLocales {
        locale
        value
      }
    }
  }
}

fragment CTCategory on Category {
  id
  key
  version
  name(locale: "en")
  nameAllLocales {
    locale
    value
  }
  description(locale: "en")
  descriptionAllLocales {
    locale
    value
  }
  slug(locale: "en")
  slugAllLocales {
    locale
    value
  }
  ancestorsRef {
    typeId
    id
  }
  ancestors {
    id
  }
  children {
    id
  }
  stagedProductCount
}

fragment Teasable on CM_CMTeasable {
  teaserTarget {
    ...ExternalChannel
    ...ExternalProduct
  }
  teaserTargets {
    target {
      ...ExternalChannel
      ...ExternalProduct
    }
  }
}
`,
          variables: `{
  "path": "commercetools-en-us"
}`,
        },
      ],
    },
  });
  server.listen().then(({ url }) => {
    console.log(`Server running. Open ${url} to run queries.`);
  });
}

try {
  dotenv.config();
  run();
} catch (e) {
  console.log(e, e.message, e.stack);
}
