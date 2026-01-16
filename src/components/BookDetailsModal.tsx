import React from "react";
import type { Book } from "../types";
import { X } from "lucide-react";

interface BookDetailsModalProps {
  book: Book | null;
  onClose: () => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  onClose,
}) => {
  if (!book) return null;
  const { title, description, imageBase64 } = book;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-start p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {imageBase64 && (
            <img
              src={imageBase64}
              alt={title}
              className="w-full h-auto max-h-72 object-contain rounded-md mb-4 bg-gray-100"
            />
          )}

          {description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap wrap-break-word">
              {description}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">Нет описания.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
