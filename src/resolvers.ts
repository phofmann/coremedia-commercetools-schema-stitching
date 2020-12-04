import {GraphQLResolveInfo, Kind} from "graphql";
import {delegateToSchema} from "@graphql-tools/delegate";
import {WrapQuery} from "@graphql-tools/wrap";
import {transforms} from "./index";

export const resolvers = (coreMediaSchema, commerceSchema) => {
    return {
        Category: {
            augmentation: {
                selectionSet: `{ key }`,
                resolve(
                    category,
                    args: Record<string, string>,
                    context: Record<string, string>,
                    info: GraphQLResolveInfo
                ) {
                    const externalId = "ct:///catalog/category/" + category.key;
                    console.log(externalId);
                    return delegateToSchema({
                        schema: coreMediaSchema,
                        operation: "query",
                        fieldName: "commerce",
                        context,
                        info,
                        transforms: [
                            new WrapQuery(
                                ['commerce'],
                                subtree => ({
                                    kind: Kind.SELECTION_SET,
                                    selections: [
                                        {
                                            kind: Kind.FIELD,
                                            name: {
                                                kind: Kind.NAME,
                                                value: 'category',
                                            },
                                            arguments: [
                                                {
                                                    kind: Kind.ARGUMENT,
                                                    name: {kind: Kind.NAME, value: 'categoryId'},
                                                    value: {kind: Kind.STRING, value: externalId},
                                                },
                                                {
                                                    kind: Kind.ARGUMENT,
                                                    name: {kind: Kind.NAME, value: 'siteId'},
                                                    value: {kind: Kind.STRING, value: 'commercetoolsenus'},
                                                },
                                            ],
                                            selectionSet: subtree,
                                        },
                                    ],
                                }),
                                result => result && result.category,
                            ),
                            ...transforms
                        ],
                    });
                },
            },
        },
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
                        schema: commerceSchema,
                        operation: "query",
                        fieldName: "category",
                        args: {key: externalId},
                        context,
                        info,
                    });
                },
            },
        },
        CM_CMExternalProductImpl: {
            ctProduct: {
                selectionSet: `{ externalId }`,
                resolve(
                    cmProductTeaser,
                    args: Record<string, string>,
                    context: Record<string, string>,
                    info: GraphQLResolveInfo
                ) {
                    const externalId = cmProductTeaser.externalId.substr(
                        "ct:///catalog/product/".length,
                        cmProductTeaser.externalId.length
                    );
                    return delegateToSchema({
                        schema: commerceSchema,
                        operation: "query",
                        fieldName: "product",
                        args: {key: externalId},
                        context,
                        info,
                    });
                },
            },
        },
        CM_CMProductTeaserImpl: {
            ctProduct: {
                selectionSet: `{ externalId }`,
                resolve(
                    cmProductTeaser,
                    args: Record<string, string>,
                    context: Record<string, string>,
                    info: GraphQLResolveInfo
                ) {
                    const externalId = cmProductTeaser.externalId.substr(
                        "ct:///catalog/product/".length,
                        cmProductTeaser.externalId.length
                    );
                    return delegateToSchema({
                        schema: commerceSchema,
                        operation: "query",
                        fieldName: "product",
                        args: {key: externalId},
                        context,
                        info,
                    });
                },
            },
        },
    }
};
