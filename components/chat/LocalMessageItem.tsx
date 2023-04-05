import useProfile from "@/utils/use-profile";
import * as MessageItem from "./MessageItem";
import { useMemo } from "react";
import { MessagePlaceholder } from "@/utils/stores/chat";

export function LocalMessageItem({
    item,
    onDelete,
}: {
    item: MessagePlaceholder;
    onDelete: () => void;
}) {
    const timestamp = useMemo(() => new Date(Date.now()), []);
    const { profile } = useProfile();

    return (
        <div className="opacity-50">
            <MessageItem.Root
                canDelete
                canEdit={false}
                isEditing={false}
                onEditChange={() => {}}
                onCopy={() => {}}
                onDelete={onDelete}
            >
                <MessageItem.Content timestamp={timestamp} user={profile!!}>
                    <p className="[word-wrap:break-word] [white-space:break-spaces]">
                        {item.content}
                    </p>
                    {item.error != null && (
                        <p className="text-red-400">{item.error}</p>
                    )}
                </MessageItem.Content>
            </MessageItem.Root>
        </div>
    );
}
