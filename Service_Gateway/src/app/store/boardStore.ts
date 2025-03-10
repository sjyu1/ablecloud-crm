import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Board {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  views: number;
}

interface BoardState {
  boards: Board[];
  addBoard: (title: string, content: string, author: string) => void;
  deleteBoard: (id: number) => void;
  increaseViews: (id: number) => void;
  getBoard: (id: number) => Board | undefined;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      
      addBoard: (title, content, author) =>
        set((state) => ({
          boards: [
            ...state.boards,
            {
              id: state.boards.length + 1,
              title,
              content,
              author,
              createdAt: new Date(),
              views: 0,
            },
          ],
        })),

      deleteBoard: (id) =>
        set((state) => ({
          boards: state.boards.filter((board) => board.id !== id),
        })),

      increaseViews: (id) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === id ? { ...board, views: board.views + 1 } : board
          ),
        })),

      getBoard: (id) => {
        const board = get().boards.find((b) => b.id === id);
        if (board) {
          get().increaseViews(id);
        }
        return board;
      },
    }),
    {
      name: 'board-storage', // localStorage에 저장될 키 이름
      skipHydration: true,   // 클라이언트 사이드에서만 hydration
    }
  )
); 