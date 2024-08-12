import { MessageCircleIcon } from "lucide-react";
import { SimpleDialog } from "ui/components/dialog";
import { useMounted } from "ui/hooks/use-mounted";
import { Button } from "ui/components/button";
import { useSession } from "@/utils/auth";
import { usePageStore } from "@/utils/stores/page";

export default function BoardingModal() {
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);
  const { status, data } = useSession();
  const mounted = useMounted();

  if (!mounted || status !== "authenticated") return <></>;

  return (
    <SimpleDialog
      title="Welcome!"
      description="Start talking on Shark Chat!"
      open={modal?.type === "on-boarding"}
      onOpenChange={(v) =>
        v ? setModal({ type: "on-boarding" }) : setModal(undefined)
      }
    >
      <div className="p-3 py-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 mt-4">
        <p className="text-white m-auto w-fit">
          <MessageCircleIcon className="inline size-11" />
          <span className="ml-2 text-xl font-bold">{data.user.name}</span>
        </p>
      </div>
      <div className="flex flex-row gap-3 mt-4">
        <Button
          color="primary"
          onClick={() => setModal({ type: "create-group" })}
        >
          Create Group
        </Button>

        <Button color="secondary" onClick={() => setModal(undefined)}>
          Explore
        </Button>
      </div>
    </SimpleDialog>
  );
}
