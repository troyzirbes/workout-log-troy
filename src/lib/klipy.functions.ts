import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/klipy";

const schema = z.object({
  query: z.string().trim().max(80).default(""),
  page: z.number().int().min(1).max(20).default(1),
});

export type GifResult = {
  id: string;
  title: string;
  url: string;
};

export const searchExerciseGifs = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<GifResult[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const klipyKey = process.env.KLIPY_API_KEY;
    if (!lovableKey || !klipyKey) {
      throw new Error("GIF search is not configured");
    }

    const params = new URLSearchParams({
      customer_id: "personal-workout-log",
      per_page: "24",
      page: String(data.page),
    });

    let endpoint = "/gifs/trending";
    if (data.query) {
      endpoint = "/gifs/search";
      params.set("q", `${data.query} exercise workout`);
    }

    const response = await fetch(`${GATEWAY_URL}${endpoint}?${params}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": klipyKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`KLIPY request failed [${response.status}]: ${body}`);
      throw new Error(`GIF search failed [${response.status}]: ${body}`);
    }

    const json = (await response.json()) as {
      result?: boolean;
      data?: { data?: Array<Record<string, unknown>> };
    };
    if (!json.result) {
      throw new Error(`GIF search failed: ${JSON.stringify(json)}`);
    }

    const items = json.data?.data ?? [];
    return items
      .map((item) => {
        const file = (item.file ?? {}) as Record<string, any>;
        const url =
          file?.md?.gif?.url ??
          file?.sm?.gif?.url ??
          file?.xs?.gif?.url ??
          file?.hd?.gif?.url ??
          file?.md?.webp?.url ??
          file?.sm?.webp?.url ??
          null;
        return {
          id: String(item.id ?? item.slug ?? url ?? Math.random()),
          title: String(item.title ?? "Exercise demo"),
          url: url as string | null,
        };
      })
      .filter((item): item is GifResult => Boolean(item.url));
  });
