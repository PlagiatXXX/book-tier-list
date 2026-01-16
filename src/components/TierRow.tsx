import React, { useState, useEffect, useRef } from "react";
import BookCard from "./BookCard";
import { useDroppable } from "@dnd-kit/core";
import type { Book } from "../types";
import ConfirmationModal from "./ConfirmationModal";
import { Palette } from "lucide-react";

const isColorLight = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Используем стандартную формулу для расчета яркости (YIQ)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Возвращаем true, если яркость выше порогового значения (160 - безопасный порог)
  return luminance > 160;
};

interface TierRowProps {
  id: string;
  title: string;
  color: string;
  books: Book[];
  onColorChange: (id: string, newColor: string) => void;
  onDelete: (id: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  onDeleteBook: (book: Book) => void;
  onOpenDetails: (book: Book) => void;
}

const TierRow: React.FC<TierRowProps> = React.memo(
  ({
    id,
    title,
    color,
    books,
    onColorChange,
    onDelete,
    onTitleChange,
    onDeleteBook,
    onOpenDetails,
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: id,
      data: { type: "tier", id },
    });

    const [isEditing, setIsEditing] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);


    //  Определяем цвет иконок на основе фона ---
    const useDarkIcons = isColorLight(color);
    const textColorClass = useDarkIcons ? 'text-gray-800' : 'text-white';

    useEffect(() => {
      setCurrentTitle(title);
    }, [title]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleTitleBlur = () => {
      setIsEditing(false);
      if (currentTitle.trim() === "") {
        setCurrentTitle(title);
      } else {
        onTitleChange(id, currentTitle);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleTitleBlur();
      }
      if (e.key === "Escape") {
        setIsEditing(false);
        setCurrentTitle(title);
      }
    };

    return (
      <div className="flex items-stretch group/row">
        {/* --- Блок заголовка уровня --- */}
        <div
          style={{ backgroundColor: color }}
          className="flex-none w-32 flex flex-col items-center justify-center text-black font-bold text-center rounded-l-md p-2 relative shadow-md"
        >
          {/* --- УСЛОВНЫЙ РЕНДЕРИНГ: ИНПУТ ИЛИ ТЕКСТ --- */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              className={`w-full bg-transparent text-center border-b-2 border-current outline-none ${textColorClass}`}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className={`cursor-text hover:bg-black/10 px-2 py-1 rounded w-full wrap-break-word ${textColorClass}`}
            >
              {title}
            </span>
          )}
          <div className="flex items-center gap-2 mt-2">
            <input
              id={`color-picker-${id}`}
              type="color"
              value={color}
              onChange={(e) => onColorChange(id, e.target.value)}
              className="sr-only"
              title="Выбери цвет, Алина!"
            />
            <label
              htmlFor={`color-picker-${id}`}
              className="w-7 h-7 bg-black/20 hover:bg-black/30 rounded-full cursor-pointer flex items-center justify-center transition-all shadow"
              title="Выбрать цвет"
            >
              <Palette size={16} className={textColorClass} />
            </label>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-7 h-7 bg-black/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-all shadow cursor-pointer"
              title="Удалить ряд"
            >
              {/* <Trash2 className={iconColorClass} /> */}
              🗑️
            </button>
          </div>
        </div>

        {/* --- Контейнер для книг --- */}
        <div
          ref={setNodeRef}
          className={`grow p-2 min-h-35 flex flex-wrap items-start content-start gap-1 rounded-r-md transition-all 
            bg-yellow-800 border-t-8 border-yellow-700
            shadow-[0_8px_5px_rgba(0,0,0,0.4),inset_0_4px_3px_rgba(0,0,0,0.3)] ${
            isOver ? "ring-2 ring-offset-2 ring-indigo-400" : ""
          }`}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              onDelete={() => onDeleteBook(book)}
              onOpenDetails={onOpenDetails}
              {...book}
            />
          ))}
        </div>

        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => {
            onDelete(id);
            setIsModalOpen(false);
          }}
          title="Удалить колонку?"
          message={`Алина, ты уверена, что хочешь удалить колонку "${title}"? Все книги в ней вернутся в палитру.`}
        />
      </div>
    );
  }
);

TierRow.displayName = "TierRow";

export default TierRow;
