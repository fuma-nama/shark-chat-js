import { observable } from "@trpc/server/observable";
import { procedure, router } from "./../trpc";

export const chatRouter = router({
    onAdd: procedure.subscription(() => {
        // `resolve()` is triggered for each client when they start subscribing `onAdd`
        // return an `observable` with a callback which is triggered immediately
        return observable<string>((emit) => {
            const onAdd = (data: string) => {
                // emit data to client
                emit.next(data);
            };
            // trigger `onAdd()` when `add` is triggered in our event emitter
            onAdd("Hello World");
            let num = 0;

            setInterval(() => {
                onAdd(`Hello World ${num++}`);
            }, 1000);
            // unsubscribe function when client disconnects or stops subscribing
            return () => {};
        });
    }),
});
