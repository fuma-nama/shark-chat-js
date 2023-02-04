import { AppLayout } from "@/components/layout/app";
import {
    GetBookQuery,
    GetBookQueryVariables,
    OnChatSubscription,
    OnChatSubscriptionVariables,
} from "@/gql/generated/graphql";
import { gql, useQuery, useSubscription } from "@apollo/client";

const GET_BOOK = gql`
    query getBook {
        book
    }
`;

const CHAT_SUBSCRIPTION = gql`
    subscription onChat {
        counter
    }
`;

export default function Home() {
    const { data, loading, subscribeToMore } = useQuery<
        GetBookQuery,
        GetBookQueryVariables
    >(GET_BOOK);

    return (
        <AppLayout>
            <p className="font-bold text-2xl">Home</p>
        </AppLayout>
    );
}

function Counter() {
    const { data, loading } = useSubscription<
        OnChatSubscription,
        OnChatSubscriptionVariables
    >(CHAT_SUBSCRIPTION);

    return <p>{data?.counter}</p>;
}
