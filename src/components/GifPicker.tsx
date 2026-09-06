import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function GifPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const trimmed = url.trim();
  const valid = /^https?:\/\/\S+$/i.test(trimmed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a demo GIF</DialogTitle>
          <DialogDescription>
            Paste the link (URL) of any publicly available GIF that shows how
            the movement is done.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSelect(trimmed);
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="gif-url">GIF link</Label>
            <Input
              id="gif-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/demo.gif"
              type="url"
              autoFocus
            />
          </div>

          {valid && (
            <img
              src={trimmed}
              alt="GIF preview"
              className="h-40 w-full rounded-xl border border-border object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
              onLoad={(e) => (e.currentTarget.style.display = "block")}
            />
          )}

          <Button type="submit" className="w-full" disabled={!valid}>
            Use this GIF
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
