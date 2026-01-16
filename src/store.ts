import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book, Tier } from './types';

interface TierListData {
  tiers: Tier[];
  paletteBooks: Book[];
}

interface TierListState {
  tierListsByYear: { [year: string]: TierListData };
  currentYear: string;
  activeTheme: string;
  setTheme: (themeId: string) => void;
  setCurrentYear: (year: string) => void;
  createNewYearList: (year: string) => void;
  addBookToPalette: (title: string, imageBase64?: string, description?: string) => void;
  deleteBookPermanently: (bookId: string) => void;
  addTier: () => void;
  deleteTier: (tierId: string) => void;
  updateTierTitle: (tierId: string, newTitle: string) => void;
  updateTierColor: (tierId: string, newColor: string) => void;
  moveBook: (bookId: string, targetType: 'palette' | 'tier', targetId?: string) => void;
}

// --- Утилита для создания пустого рейтинга на новый год ---
const createInitialTierList = (): TierListData => ({
  tiers: [
    { id: 's-tier', title: '1 место', color: '#ff7f7f', books: [] },
    { id: 'a-tier', title: '2 место', color: '#ffbf7f', books: [] },
    { id: 'b-tier', title: '3 место', color: '#ffff7f', books: [] },
  ],
  paletteBooks: [],
});

const currentSystemYear = new Date().getFullYear().toString();


export const useTierListStore = create<TierListState>()(
  persist(
    (set, get) => ({
      currentYear: currentSystemYear,
      tierListsByYear: {
        [currentSystemYear]: createInitialTierList(),
      },

      activeTheme: 'library',
      setTheme: (themeId) => set({ activeTheme: themeId }),

      setCurrentYear: (year) => {
        const { tierListsByYear } = get();
        // Если переключаемся на год, которого еще нет, создаем для него пустой список
        if (!tierListsByYear[year]) {
            set((state) => ({
                currentYear: year,
                tierListsByYear: {
                    ...state.tierListsByYear,
                    [year]: createInitialTierList(),
                }
            }));
        } else {
            set({ currentYear: year });
        }
      },
      createNewYearList: (year) => {
        if (!year.trim() || get().tierListsByYear[year]) return; // Не создавать, если год пустой или уже существует
        set((state) => ({
            tierListsByYear: {
                ...state.tierListsByYear,
                [year]: createInitialTierList(),
            }
        }));
      },

      addBookToPalette: (title, imageBase64, description) => {
        set((state) => {
            const { currentYear, tierListsByYear } = state;
            const currentList = tierListsByYear[currentYear];
            const newBook: Book = { id: crypto.randomUUID(), title, imageBase64, description };
            
            const nextList: TierListData = {
                ...currentList,
                paletteBooks: [newBook, ...currentList.paletteBooks],
            };

            return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
        });
      },

      deleteBookPermanently: (bookId) => {
          set(state => {
              const { currentYear, tierListsByYear } = state;
              const currentList = tierListsByYear[currentYear];

              const nextList: TierListData = {
                  paletteBooks: currentList.paletteBooks.filter(b => b.id !== bookId),
                  tiers: currentList.tiers.map(tier => ({
                      ...tier,
                      books: tier.books.filter(b => b.id !== bookId),
                  })),
              };

              return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
          });
      },

      addTier: () => {
          set(state => {
              const { currentYear, tierListsByYear } = state;
              const currentList = tierListsByYear[currentYear];
              const newTier: Tier = { id: crypto.randomUUID(), title: 'Новый ряд', color: '#cccccc', books: [] };

              const nextList: TierListData = {
                  ...currentList,
                  tiers: [...currentList.tiers, newTier],
              };

              return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
          });
      },

      deleteTier: (tierId) => {
        set(state => {
            const { currentYear, tierListsByYear } = state;
            const currentList = tierListsByYear[currentYear];
            const tierToDelete = currentList.tiers.find(t => t.id === tierId);

            if (!tierToDelete) return state;

            const nextList: TierListData = {
                paletteBooks: [...currentList.paletteBooks, ...tierToDelete.books],
                tiers: currentList.tiers.filter(t => t.id !== tierId),
            };

            return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
        });
      },

      updateTierTitle: (tierId, newTitle) => {
          set(state => {
              const { currentYear, tierListsByYear } = state;
              const currentList = tierListsByYear[currentYear];
              const nextList: TierListData = {
                  ...currentList,
                  tiers: currentList.tiers.map(t => t.id === tierId ? { ...t, title: newTitle } : t),
              };
              return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
          });
      },

      updateTierColor: (tierId, newColor) => {
          set(state => {
              const { currentYear, tierListsByYear } = state;
              const currentList = tierListsByYear[currentYear];
              const nextList: TierListData = {
                  ...currentList,
                  tiers: currentList.tiers.map(t => t.id === tierId ? { ...t, color: newColor } : t),
              };
              return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
          });
      },

      moveBook: (bookId, targetType, targetId) => {
        set(state => {
            const { currentYear, tierListsByYear } = state;
            const currentList = tierListsByYear[currentYear];
            
            let bookToMove: Book | undefined;
            let source = { type: '', id: '' };

            bookToMove = currentList.paletteBooks.find(b => b.id === bookId);
            if (bookToMove) {
              source = { type: 'palette', id: 'palette' };
            } else {
              for (const tier of currentList.tiers) {
                const foundBook = tier.books.find(b => b.id === bookId);
                if (foundBook) {
                  bookToMove = foundBook;
                  source = { type: 'tier', id: tier.id };
                  break;
                }
              }
            }

          if (!bookToMove) return state;


          // 2. Создать новое состояние, удалив книгу из источника
          let nextPaletteBooks = [...currentList.paletteBooks];
          const nextTiers = currentList.tiers.map(t => ({ ...t, books: [...t.books] }));

          if (source.type === 'palette') {
            nextPaletteBooks = currentList.paletteBooks.filter(b => b.id !== bookId);
          } else if (source.type === 'tier') {
            const sourceTier = nextTiers.find(t => t.id === source.id);
            if(sourceTier) {
                sourceTier.books = sourceTier.books.filter(b => b.id !== bookId);
            }
          }

     // 3. Добавить книгу в целевое место
          if (targetType === 'palette') {
              nextPaletteBooks.push(bookToMove);
            } else if (targetType === 'tier' && targetId) {
              const targetTier = nextTiers.find(t => t.id === targetId);
              if (targetTier) targetTier.books.push(bookToMove);
              else nextPaletteBooks.push(bookToMove);
            }

            const nextList: TierListData = {
                tiers: nextTiers,
                paletteBooks: nextPaletteBooks,
            };

            return { tierListsByYear: { ...tierListsByYear, [currentYear]: nextList }};
        });
      },
    }),
    {
      name: 'tier-list-storage',
    }
  )
);