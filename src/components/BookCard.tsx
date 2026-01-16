import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { X } from "lucide-react";
import type { Book } from "../types";

interface BookCardProps extends Book {
  isOverlay?: boolean;
  onDelete?: (id: string) => void;
  onOpenDetails?: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = React.memo(
  ({ id, title, description, imageBase64, isOverlay, onDelete, onOpenDetails }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({ id, data: { book: { id, title, description, imageBase64 } } });

      const style: React.CSSProperties = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      opacity: isDragging && !isOverlay ? 0 : 1,
      cursor: isOverlay ? "grabbing" : "grab",
      touchAction: "none",
    };

    // двойной клик / двойной тап
    const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!isDragging && onOpenDetails) {
        onOpenDetails({ id, title, description, imageBase64  });
      }
    };
    

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative group bg-white rounded-md shadow-sm p-1 m-0.5 w-20 h-28 flex flex-col items-center justify-center text-center text-xs font-medium border border-gray-300 hover:shadow-md hover:scale-105 transition-all duration-200 ${
          isOverlay ? "shadow-lg scale-110" : ""
        }`}
        onDoubleClick={handleDoubleClick}
      >
        {/* Кнопка удаления */}
        {onDelete && !isOverlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="absolute top-0 right-0 z-10 p-0.5 bg-red-500 rounded-full text-black translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Удалить книгу"
          >
            <X size={14} />
          </button>
        )}

        {/* Drag handle + двойной клик/тап */}
        <div
          {...listeners}
          {...attributes}
          className="w-full h-full flex flex-col items-center justify-center cursor-grab"
        >
          {imageBase64 ? (
            <img
              src={imageBase64}
              alt={title}
              className="w-full h-3/4 object-cover rounded mb-0.5 pointer-events-none"
            />
          ) : (
            <div className="w-full h-3/4 bg-gray-200 flex items-center justify-center rounded-t-md mb-0.5 text-xs text-gray-500 pointer-events-none">
              Добавь картинку
            </div>
          )}
          <span className="w-full text-gray-700 line-clamp-2 leading-tight px-0.5 pointer-events-none">
            {title}
          </span>
        </div>
      </div>
    );
  }
);

BookCard.displayName = "BookCard";

export default BookCard;
