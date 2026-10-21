import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SortableExercise({
  id, name, disabled, className, children,
}: {
  id: string;
  name: string;
  disabled: boolean;
  className: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <section
      ref={setNodeRef}
      data-exercise-id={id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, "relative", isDragging && "z-40 shadow-lg ring-2 ring-primary")}
    >
      {children(
        <Button
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="size-10 shrink-0 touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${name}`}
          title={`Reorder ${name}`}
        >
          <GripVertical className="size-5" />
        </Button>,
      )}
    </section>
  );
}