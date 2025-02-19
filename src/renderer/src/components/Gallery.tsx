import { Loader2 } from "lucide-react";
import { useLibrary } from "../hooks/useLibrary";
import { formatFileSize } from "../lib/utils";
import { ScrollArea } from "./ui/scroll-area";

interface GalleryProps {
  libraryPath: string;
}

export const Gallery = ({ libraryPath }: GalleryProps) => {
  const { mediaFiles, scanning, error } = useLibrary(libraryPath);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Your Library</h1>
          <p className="text-muted-foreground">
            {error ? error : `Found ${mediaFiles.length} media files in your library`}
          </p>
        </div>
      </div>

      {scanning ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        !error && (
          <ScrollArea className="flex-1 rounded-md border">
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mediaFiles.map((file) => (
                  <div
                    key={file.path}
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:border-primary transition-colors"
                  >
                    {file.type === "image" ? (
                      <img
                        src={`media://${file.path}`}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg overflow-hidden"
                      />
                    ) : file.type === "video" ? (
                      <video
                        src={`media://${file.path}`}
                        className="w-full h-full object-cover rounded-lg overflow-hidden"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground rounded-lg">
                        Unsupported media type
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
                {mediaFiles.length === 0 && !scanning && (
                  <div className="col-span-full text-center text-muted-foreground p-4">
                    No media files found in the library
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )
      )}
    </div>
  );
};
