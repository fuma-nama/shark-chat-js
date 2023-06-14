import { Embed } from "db/schema";
import ogs from "open-graph-scraper";
import probe from "probe-image-size";

/**
 * Fetch url info and open-graph images, timeout: ~10 seconds
 *
 * @param url target url
 * @returns Embed info
 */
export async function info(url: string) {
    const { result, error } = await ogs({
        url: url,
        timeout: 5000,
    });

    if (error || result.ogTitle == null) return;

    const embed: Embed = {
        title: result.ogTitle,
        url: result.ogUrl ?? url,
        description: result.ogDescription?.slice(0, 100),
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

    return embed;
}
