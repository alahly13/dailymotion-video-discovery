import { Index } from "flexsearch";
import type { NormalizedVideoMetadata } from "@/types/video";

type SearchableValue = string | number | null | undefined;

export type VideoSearchIndex = {
  documents: Map<string, NormalizedVideoMetadata>;
  title: Index;
  owner: Index;
  body: Index;
  metadata: Index;
};

export type VideoSearchOptions = {
  fuzzy?: boolean;
  exactPhrase?: boolean;
  limit?: number;
};

export function searchText(value: SearchableValue) {
  return value === null || value === undefined ? "" : String(value);
}

export function normalizeVideoSearchQuery(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function searchableVideoText(video: NormalizedVideoMetadata) {
  const provenance = video.collectionProvenance;
  return [
    video.title,
    video.description,
    video.ownerName,
    video.channelName,
    provenance?.sourceName,
    provenance?.sourceHandle,
    video.language,
    video.tags.join(" "),
    searchText(video.year),
    searchText(video.duration),
    searchText(video.views),
    searchText(provenance?.attemptNumber),
    provenance?.fetchProfile,
    provenance?.windowStart,
    provenance?.windowEnd,
    searchText(provenance?.pageNumber),
    provenance?.collectedAt,
  ].filter(Boolean).join(" ");
}

function addDocument(index: Index, id: string, value: string) {
  const content = value.trim();
  if (content) index.add(id, content);
}

export function buildVideoSearchIndex(items: readonly NormalizedVideoMetadata[]): VideoSearchIndex {
  const documents = new Map(items.map((item) => [item.id, item]));
  const title = new Index({ tokenize: "full", encoder: "Normalize", cache: true });
  const owner = new Index({ tokenize: "full", encoder: "Normalize", cache: true });
  const body = new Index({ tokenize: "full", encoder: "Normalize", cache: true });
  const metadata = new Index({ tokenize: "full", encoder: "Normalize", cache: true });

  // Channel Explorer and saved channel pages both search collected metadata,
  // not Dailymotion. Separate indexes provide field weighting while keeping the
  // browser index intentionally scoped to the loaded/live manifest items.
  for (const item of items) {
    const provenance = item.collectionProvenance;
    addDocument(title, item.id, item.title);
    addDocument(owner, item.id, [item.ownerName, item.channelName, provenance?.sourceName, provenance?.sourceHandle].filter(Boolean).join(" "));
    addDocument(body, item.id, [item.description, item.tags.join(" ")].filter(Boolean).join(" "));
    addDocument(metadata, item.id, [
      item.language,
      searchText(item.year),
      searchText(item.duration),
      searchText(item.views),
      searchText(provenance?.attemptNumber),
      provenance?.fetchProfile,
      provenance?.windowStart,
      provenance?.windowEnd,
      searchText(provenance?.pageNumber),
      provenance?.collectedAt,
    ].filter(Boolean).join(" "));
  }

  return { documents, title, owner, body, metadata };
}

export function searchVideoIndex(index: VideoSearchIndex, query: string, options: VideoSearchOptions = {}) {
  const normalizedQuery = normalizeVideoSearchQuery(query);
  if (!normalizedQuery) return [...index.documents.values()];

  const scores = new Map<string, number>();
  const searchOptions = { limit: options.limit ?? 500, suggest: options.fuzzy !== false };
  const apply = (ids: unknown[], weight: number) => {
    ids.forEach((id, rank) => {
      const key = String(id);
      scores.set(key, (scores.get(key) ?? 0) + weight + Math.max(0, 30 - rank));
    });
  };

  apply(index.title.search(normalizedQuery, searchOptions) as unknown[], 12);
  apply(index.owner.search(normalizedQuery, searchOptions) as unknown[], 7);
  apply(index.body.search(normalizedQuery, searchOptions) as unknown[], 6);
  apply(index.metadata.search(normalizedQuery, searchOptions) as unknown[], 2);

  const exact = normalizedQuery.toLocaleLowerCase();
  for (const item of index.documents.values()) {
    if (searchableVideoText(item).toLocaleLowerCase().includes(exact)) {
      scores.set(item.id, (scores.get(item.id) ?? 0) + 3);
    }
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ video: index.documents.get(id), score }))
    .filter((entry): entry is { video: NormalizedVideoMetadata; score: number } => Boolean(entry.video))
    .filter(({ video }) => !options.exactPhrase || searchableVideoText(video).toLocaleLowerCase().includes(exact))
    .sort((a, b) => b.score - a.score)
    .map(({ video }) => video);
}

export function searchVideos(items: readonly NormalizedVideoMetadata[], query: string, options: VideoSearchOptions = {}) {
  return searchVideoIndex(buildVideoSearchIndex(items), query, options);
}
