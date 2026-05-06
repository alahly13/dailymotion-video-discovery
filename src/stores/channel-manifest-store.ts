import { create } from "zustand";
import type { ChannelManifest } from "@/types/manifest";

interface ChannelManifestState {
  manifest: ChannelManifest | null;
  setManifest: (manifest: ChannelManifest | null) => void;
}

export const useChannelManifestStore = create<ChannelManifestState>((set) => ({ manifest: null, setManifest: (manifest) => set({ manifest }) }));
