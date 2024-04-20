import { trpc } from "@/utils/trpc";
import { useForm } from "react-hook-form";
import { Button } from "ui/components/button";
import { SimpleDialog } from "ui/components/dialog";
import { input } from "ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import { UniqueNameInput } from "../input/UniqueNameInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniqueNameSchema } from "shared/schema/group";
import { z } from "zod";

export default function JoinGroupModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <SimpleDialog
      title="Join Group"
      description="Chat with other peoples in the group"
      open={open}
      onOpenChange={setOpen}
    >
      <Tabs defaultValue="code">
        <TabsList className="grid w-full grid-cols-2 mt-4">
          <TabsTrigger value="code" asChild>
            <label htmlFor="code">Invite Code</label>
          </TabsTrigger>
          <TabsTrigger value="unique_name" asChild>
            <label htmlFor="code">Unique Name</label>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="code" tabIndex={-1}>
          <JoinGroupByCode onClose={() => setOpen(false)} />
        </TabsContent>
        <TabsContent value="unique_name" tabIndex={-1}>
          <JoinGroupByName onClose={() => setOpen(false)} />
        </TabsContent>
      </Tabs>
    </SimpleDialog>
  );
}

function JoinGroupByCode({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState, setError } = useForm<{
    code: string;
  }>({
    defaultValues: {
      code: "",
    },
  });

  const joinMutation = trpc.group.join.useMutation({
    onSuccess(data) {
      onClose();
    },
    onError(e) {
      setError("code", { message: e.message, type: "value" });
    },
  });

  const onJoin = handleSubmit(({ code }) =>
    joinMutation.mutate({
      code,
    })
  );

  return (
    <form onSubmit={onJoin}>
      <fieldset className="mt-3">
        <input
          id="code"
          autoComplete="off"
          className={input()}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
          {...register("code", { minLength: 4 })}
        />
        <p className="text-xs text-destructive">
          {formState.errors?.code?.message}
        </p>
      </fieldset>
      <Button
        type="submit"
        color="primary"
        className="mt-6 w-full"
        isLoading={joinMutation.isLoading}
      >
        Join
      </Button>
    </form>
  );
}

const schema = z.object({
  unique_name: uniqueNameSchema,
});

function JoinGroupByName({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState, setError } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      unique_name: "",
    },
  });

  const joinMutation = trpc.group.joinByUniqueName.useMutation({
    onSuccess() {
      onClose();
    },
    onError(e) {
      setError("unique_name", { message: e.message, type: "value" });
    },
  });

  const onJoin = handleSubmit(({ unique_name }) =>
    joinMutation.mutate({
      uniqueName: unique_name,
    })
  );

  return (
    <form onSubmit={onJoin}>
      <fieldset className="mt-3">
        <UniqueNameInput
          input={{
            id: "code",
            autoComplete: "off",
            placeholder: "my_group_name",
            ...register("unique_name"),
          }}
        />
        <p className="text-xs text-destructive">
          {formState.errors.unique_name?.message}
        </p>
      </fieldset>
      <Button
        type="submit"
        color="primary"
        className="mt-6 w-full"
        isLoading={joinMutation.isLoading}
      >
        Join
      </Button>
    </form>
  );
}
