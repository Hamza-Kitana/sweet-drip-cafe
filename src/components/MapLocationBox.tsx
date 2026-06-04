import { ExternalLink, MapPin } from "lucide-react";
import { CAFE_ADDRESS, CAFE_MAP_EMBED, CAFE_MAPS_URL } from "@/lib/location";

type MapLocationBoxProps = {
  className?: string;
  aspectClassName?: string;
  borderClassName?: string;
  showLabel?: boolean;
};

export function MapLocationBox({
  className = "",
  aspectClassName = "aspect-[4/3]",
  borderClassName = "border border-border",
  showLabel = true,
}: MapLocationBoxProps) {
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            {CAFE_ADDRESS}
          </p>
          <a
            href={CAFE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            Open in Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <div
        className={`relative min-h-[280px] w-full overflow-hidden rounded-2xl bg-muted shadow-glow sm:min-h-[340px] sm:rounded-3xl lg:min-h-[400px] ${borderClassName} ${aspectClassName}`}
      >
        <iframe
          title="Sweet Drip on Google Maps"
          src={CAFE_MAP_EMBED}
          className="absolute inset-0 z-[1] h-full w-full touch-auto border-0"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen; geolocation"
          allowFullScreen
        />
      </div>
    </div>
  );
}
