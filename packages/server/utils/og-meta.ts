import { Embed } from "db/schema";
import ogs from "open-graph-scraper";
import probe from "probe-image-size";
import redis from "../redis/client";

function getKey(url: string) {
    return `og_meta_${url}`;
}

/**
 * Fetch url info and open-graph images, timeout: ~10 seconds
 *
 * @param url target url
 * @returns Embed info
 */
export async function info(url: string) {
    const cache = await redis.get<Embed>(getKey(url));

    if (cache != null) return cache;

    const { result, error } = await ogs({
        url: url,
        timeout: 5000,
    });

    if (error || result.ogTitle == null) return;

    const embed: Embed = {
        title: result.ogTitle,
        url: result.ogUrl ?? url,
        description: result.ogDescription,
    };

    if (result.ogImage?.[0] != null) {
        const data = await probe(result.ogImage[0].url, {
            timeout: 5000,
        });

        embed.image = {
            url: data.url,
            width: data.width,
            height: data.height,
        };
    }

    //15 minutes
    redis.set(getKey(url), embed, { ex: 60 * 15 });

    return embed;
}
