export type AnalyticsPostCardCaptionProps = {
  caption: string;
};

export const AnalyticsPostCardCaption = ({ caption }: AnalyticsPostCardCaptionProps) => (
  <div className="min-w-0 text-left text-xs leading-snug text-base-content/80 line-clamp-3">
    {caption}
  </div>
);
