import { Embed } from "db/schema";
import ogs from "open-graph-scraper";
import probe from "probe-image-size";
import { Readable } from "node:stream";
import { ReadableStream as WebReadableStream } from "node:stream/web";

const timeout = 10 * 1000;

/**
 * Fetch url info and open-graph images, timeout: ~10 seconds
 *
 * @param url target url
 * @returns Embed info
 */
export async function info(url: string): Promise<Embed | undefined> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
        method: "GET",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
        next: {
            revalidate: 1000,
        },
    }).finally(() => clearTimeout(timer));

    const contentType = response.headers.get("content-type");
    if (contentType == null || !response.ok) return;

    if (contentType.startsWith("text/html")) {
        const { result, error } = await ogs({
            html: await response.text(),
            url: undefined as unknown as string,
        });

        if (error || (result.ogTitle == null && result.ogDescription == null))
            return;

        const embed: Embed = {
            title: result.ogTitle,
            url: url,
            description: result.ogDescription?.slice(0, 100),
        };

        if (result.ogImage?.[0] != null) {
            const imgUrl = result.ogImage[0].url.startsWith("/")
                ? new URL(result.ogImage[0].url, result.ogUrl ?? url).toString()
                : result.ogImage[0].url;

            const data = await probe(imgUrl, {
                timeout: 5000,
            });

            embed.image = {
                url: data.url,
                width: data.width,
                height: data.height,
            };
        }

        return embed;
    } else if (contentType.startsWith("image/")) {
        const blob = await response.blob();
        const data = await probe(
            Readable.from(blob.stream() as WebReadableStream),
            false
        );

        return {
            url: url,
            image: {
                url: url,
                width: data.width,
                height: data.height,
            },
        };
    }
}
