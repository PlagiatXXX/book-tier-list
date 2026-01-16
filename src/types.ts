export interface Book {
  id: string;
  title: string;
  imageBase64?: string;
  description?: string;
}

export interface Tier {
  id: string;
  title: string;
  color: string;
  books: Book[];
}