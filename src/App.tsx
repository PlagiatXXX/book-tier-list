import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { Download, Plus, CalendarPlus, Paintbrush } from "lucide-react";
import TierRow from "./components/TierRow";
import BookCard from "./components/BookCard";
import { AddBookForm } from "./components/AddBookForm";
import { useTierListStore } from "./store";
import type { Book } from "./types";
import ConfirmationModal from "./components/ConfirmationModal";
import BookDetailsModal from "./components/BookDetailsModal";

// --- 1. НОВЫЙ КОМПОНЕНТ ДЛЯ ОТРИСОВКИ ФОНА ---
const ThemeBackground = ({ themeId }: { themeId: string }) => {
  switch (themeId) {
    case "library":
      return (
        <>
          <div
            style={{
              backgroundImage: `url(/library.webp)`
            }}
            className="fixed inset-0 bg-cover bg-center z-[-1]"
          />
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[-1]" />
        </>
      );
    case "flowers":
      return (
        <>
          <div
            style={{
              backgroundImage: `url(/flowers.webp)`,
            }}
            className="fixed inset-0 bg-cover bg-center z-[-1]"
          />
          <div className="fixed inset-0 z-[-1]" />
        </>
      );
    case "city":
      return (
        <>
          <div
            style={{
              backgroundImage: `url(/city.webp)`,
            }}
            className="fixed inset-0 bg-cover bg-center z-[-1]"
          />
          <div className="fixed inset-0 z-[-1]" />
        </>
      );
    case "dark":
      return <div className="fixed inset-0 bg-gray-900 z-[-1]" />;
    case "light":
      return (
        <div
          className="fixed inset-0 z-[-1] bg-[#f8f9fa]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e9ecef' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      );
    case "sand":
      return (
        <div
          className="fixed inset-0 z-[-1] bg-[#f8f9fa]"
          style={{
            backgroundImage: `url(/sand.webp)`,
          }}
        />
      );
    default:
      return null;
  }
};

// --- 2. НОВЫЙ КОМПОНЕНТ-ПЕРЕКЛЮЧАТЕЛЬ ТЕМ ---
const ThemeSwitcher = () => {
  const { activeTheme, setTheme } = useTierListStore();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: "library", name: "Библиотека" },
    { id: "flowers", name: "Желтые цветы" },
    { id: "city", name: "Город" },
    { id: "sand", name: "Песок" },
    { id: "dark", name: "Темная" },
    { id: "light", name: "Светлая" },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
      >
        <Paintbrush size={24} className="text-gray-700 " />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-2 space-y-1">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTheme === theme.id
                  ? "bg-indigo-500 text-white"
                  : "text-gray-800 hover:bg-gray-200/80"
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const {
    tierListsByYear,
    currentYear,
    setCurrentYear,
    createNewYearList,
    addBookToPalette,
    deleteBookPermanently,
    addTier,
    deleteTier,
    updateTierTitle,
    updateTierColor,
    moveBook,
    activeTheme,
  } = useTierListStore();

  const isImageBackground = ["library", "flowers"].includes(activeTheme);
  const mainPanelClass = isImageBackground
    ? "bg-gray-100/80 backdrop-blur-md"
    : "bg-gray-100";
  const bottomPanelClass = isImageBackground
    ? "bg-white/80 backdrop-blur-md"
    : "bg-white";

  const currentTierList = tierListsByYear[currentYear] || {
    tiers: [],
    paletteBooks: [],
  };
  const { tiers, paletteBooks } = currentTierList;
  const availableYears = Object.keys(tierListsByYear).sort(
    (a, b) => Number(b) - Number(a)
  );

  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const tierListRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleExport = useCallback(() => {
    if (tierListRef.current === null) {
      return;
    }
    toPng(tierListRef.current, { cacheBust: true, backgroundColor: "#f9fafb" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "Тирлист-Алины.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Ошибка экспорта:", err);
      });
  }, [tierListRef]);

  const handleDragStart = (event: DragStartEvent) => {
    const book = event.active.data.current?.book;
    if (book) setActiveBook(book);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBook(null);
    if (!active) return;

    const bookId = active.id as string;

    if (!over) {
      moveBook(bookId, "palette");
      return;
    }

    // Если перетащили на то же место, ничего не делаем
    if (active.id === over.id) return;

    // Сценарий 2: Книгу бросили на контейнер (полку или палитру)
    if (over.data.current?.type === "tier") {
      moveBook(bookId, "tier", over.id as string);
      return;
    }
    if (over.data.current?.type === "palette") {
      moveBook(bookId, "palette");
      return;
    }

    const overBookId = over.id as string;
    const parentTier = tiers.find((tier) =>
      tier.books.some((book) => book.id === overBookId)
    );

    if (parentTier) {
      // Если та книга на полке, бросаем нашу книгу на ту же полку.
      moveBook(bookId, "tier", parentTier.id);
    } else {
      // Иначе, значит, та книга в палитре. Бросаем нашу в палитру.
      const isOverInPalette = paletteBooks.some(
        (book) => book.id === overBookId
      );
      if (isOverInPalette) {
        moveBook(bookId, "palette");
      }
    }
  };

  const { setNodeRef: paletteRef, isOver: isOverPalette } = useDroppable({
    id: "palette",
    data: { type: "palette" },
  });

  const handleDeleteBook = (book: Book) => {
    setBookToDelete(book);
  };

  const handleAddNewYear = () => {
    const newYear = prompt(
      "Введите новый год для рейтинга:",
      (Number(currentYear) + 1).toString()
    );
    if (
      newYear &&
      /^\d{4}$/.test(newYear) &&
      !availableYears.includes(newYear)
    ) {
      createNewYearList(newYear);
      setCurrentYear(newYear);
    } else if (newYear) {
      alert("Некорректный год или он уже существует!");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen font-sans text-gray-800">
        <ThemeBackground themeId={activeTheme} />
        <ThemeSwitcher />
        <main className="container mx-auto p-4">
          <div
            ref={tierListRef}
            className={`p-4 rounded-xl shadow-lg ${mainPanelClass}`}
          >
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Книжный рейтинг Алины
            </h1>
            <div className="flex justify-left items-center gap-3 mb-6">
              <label
                htmlFor="year-select"
                className="text-lg font-semibold text-gray-600"
              >
                Рейтинг за:
              </label>
              <select
                id="year-select"
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNewYear}
                className="p-2 text-gray-600 rounded-md hover:bg-gray-200 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Создать рейтинг на новый год"
              >
                <CalendarPlus size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {tiers.map((tier) => (
                <TierRow
                  key={`${currentYear}-${tier.id}`}
                  onColorChange={updateTierColor}
                  onDelete={deleteTier}
                  onTitleChange={updateTierTitle}
                  onDeleteBook={handleDeleteBook}
                  onOpenDetails={setSelectedBook}
                  {...tier}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={addTier}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            >
              <Plus size={18} />
              <span>Добавь колонку, Алина!</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            >
              <Download size={18} />
              <span>Экспорт, Алина!</span>
            </button>
          </div>

          <div className={`mt-8 p-6 rounded-xl shadow-lg ${bottomPanelClass}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 order-last lg:order-0">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                  Добавить книгу
                </h2>
                <AddBookForm onAddBook={addBookToPalette} />
              </div>

              <div className="lg:col-span-1 order-first lg:order-0">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Палитра книг
                </h2>
                <div
                  ref={paletteRef}
                  className={`rounded-lg p-3 min-h-32 bg-purple-50 transition-colors border-2 border-dashed ${
                    isOverPalette
                      ? "border-purple-500 bg-purple-50"
                      : "border-purple-300"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {paletteBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        onDelete={() => handleDeleteBook(book)}
                        onOpenDetails={setSelectedBook}
                        {...book}
                      />
                    ))}
                    {paletteBooks.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Перетащите сюда книги из рядов или добавьте новые.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <DragOverlay>
          {activeBook ? <BookCard {...activeBook} isOverlay /> : null}
        </DragOverlay>

        {bookToDelete && (
          <ConfirmationModal
            isOpen={true}
            title="Удалить книгу?"
            message={`Алина, ты уверена, что хочешь навсегда удалить книгу "${bookToDelete.title}"?`}
            onClose={() => setBookToDelete(null)}
            onConfirm={() => {
              deleteBookPermanently(bookToDelete.id);
              setBookToDelete(null);
            }}
          />
        )}

        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      </div>
    </DndContext>
  );
}

export default App;
