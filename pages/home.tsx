import { AppLayout } from "@/components/layout/app";
import { gql } from "@/gql";
import {
    GetBookQuery,
    GetBookQueryVariables,
    OnChatSubscription,
    OnChatSubscriptionVariables,
} from "@/gql/generated/graphql";
import { useQuery, useSubscription } from "@apollo/client";
import { NextPageWithLayout } from "./_app";

const GET_BOOK = gql(/* GraphQL */ `
    query getBook {
        book
    }
`);

const CHAT_SUBSCRIPTION = gql(/* GraphQL */ `
    subscription onChat {
        counter
    }
`);

const Home: NextPageWithLayout = () => {
    const { data, loading, subscribeToMore } = useQuery<
        GetBookQuery,
        GetBookQueryVariables
    >(GET_BOOK);

    return <p>Hello World</p>;
};

Home.getLayout = (children) => <AppLayout title="Home">{children}</AppLayout>;

function Counter() {
    const { data, loading } = useSubscription<
        OnChatSubscription,
        OnChatSubscriptionVariables
    >(CHAT_SUBSCRIPTION);

    return <p>{data?.counter}</p>;
}

export default Home;
