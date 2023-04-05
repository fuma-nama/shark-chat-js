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
                user={profile!!}
                timestamp={timestamp}
                canDelete
                canEdit={false}
                isEditing={false}
                onEditChange={() => {}}
                onCopy={() => {}}
                onDelete={onDelete}
            >
                <MessageItem.Text>{item.content}</MessageItem.Text>
                {item.error != null && (
                    <p className="text-red-400">{item.error}</p>
                )}
            </MessageItem.Root>
        </div>
    );
}
