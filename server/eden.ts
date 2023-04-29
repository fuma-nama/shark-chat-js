import { z } from "zod";

const schema = z.object({
    cohere: z.object({
        generated_text: z.string().trim(),
    }),
});

export async function generateText(s: string) {
    const result = await fetch("https://api.edenai.run/v2/text/generation", {
        method: "POST",
        headers: {
            authorization: `Bearer ${process.env.EDENAI_TOKEN}`,
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
            providers: "cohere",
            text: s,
            temperature: 0.5,
            max_tokens: 250,
        }),
    });

    if (result.ok) {
        const parsed = schema.parse(await result.json());

        return parsed.cohere.generated_text;
    } else {
        console.log(await result.json());
        throw new Error("Unknown error occurred");
    }
}
