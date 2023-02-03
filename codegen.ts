import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "http://localhost:8080/graphql",
    documents: ["pages/**/*.tsx"],
    generates: {
        "./gql/generated/": {
            preset: "client",
            plugins: [],
            presetConfig: {
                gqlTagName: "gql",
            },
        },
    },
    ignoreNoDocuments: true,
};

export default config;
