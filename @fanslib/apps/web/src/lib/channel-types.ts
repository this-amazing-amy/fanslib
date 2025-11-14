export const CHANNEL_TYPES = {
  onlyfans: {
    id: "onlyfans",
    name: "OnlyFans",
    color: "#00AFF0",
  },
  fansly: {
    id: "fansly",
    name: "Fansly",
    color: "#0096FF",
  },
  manyvids: {
    id: "manyvids",
    name: "ManyVids",
    color: "#FF0099",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
  },
  bluesky: {
    id: "bluesky",
    name: "BlueSky",
    color: "#0560FF",
  },
  x: {
    id: "x",
    name: "X",
    color: "#000000",
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    color: "#FF4500",
  },
  clips4sale: {
    id: "clips4sale",
    name: "Clips4Sale",
    color: "#9447ff",
  },
  redgifs: {
    id: "redgifs",
    name: "RedGIFs",
    color: "#B9199F",
  },
} as const;

export type ChannelTypeId = keyof typeof CHANNEL_TYPES;

