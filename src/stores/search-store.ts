import { create } from "zustand";
import type { TemporarySearchManifest } from "@/types/manifest";

interface SearchState { manifest: TemporarySearchManifest | null; setManifest: (manifest: TemporarySearchManifest | null) => void; }
export const useSearchStore = create<SearchState>((set) => ({ manifest: null, setManifest: (manifest) => set({ manifest }) }));
