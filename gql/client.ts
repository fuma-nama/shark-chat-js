import { ApolloClient, InMemoryCache } from "@apollo/client";
import { split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

const httpLink = new HttpLink({
    uri: "http://localhost:8080/graphql",
});

function getSplitLink() {
    const wsLink = new WebSocketLink(
        new SubscriptionClient("ws://localhost:8080/subscriptions")
    );

    return split(
        ({ query }) => {
            const definition = getMainDefinition(query);

            return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
            );
        },
        wsLink,
        httpLink
    );
}

export const client = new ApolloClient({
    link: typeof window === "undefined" ? httpLink : getSplitLink(),
    cache: new InMemoryCache(),
});
