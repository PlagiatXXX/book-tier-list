import { Plus } from "lucide-react";
import React, { useState } from "react";

interface AddBookFormProps {
  onAddBook: (
    title: string,
    imageBase64?: string,
    description?: string
  ) => void;
}

// --- НОВАЯ УТИЛИТА ДЛЯ КОНВЕРТАЦИИ ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const AddBookForm: React.FC<AddBookFormProps> = ({ onAddBook }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let imageBase64: string | undefined = undefined;
    if (imageFile) {
      try {
        imageBase64 = await fileToBase64(imageFile);
      } catch (error) {
        console.error("Ошибка конвертации файла:", error);
      }
    }

    onAddBook(title, imageBase64, description || undefined);

    setTitle("");
    setDescription("");
    setImageFile(null);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="book-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Название книги
        </label>
        <input
          id="book-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Любое..."
          className="w-full p-2.5 border border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          required
        />
      </div>

      <div>
        <label
          htmlFor="book-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Описание книги
        </label>
        <textarea
          id="book-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание..."
          className="w-full p-2.5 border border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition min-h-24 resize-y"
          rows={3}
        />
      </div>

      <div>
        <label
          htmlFor="book-image"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Книжная обложка
        </label>
        <input
          id="book-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
      >
        <Plus size={18} />
        <span>Добавить книгу</span>
      </button>
    </form>
  );
};

AddBookForm.displayName = "AddBookForm";
