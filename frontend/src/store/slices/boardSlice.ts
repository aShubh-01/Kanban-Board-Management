import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Board, BoardList, Task } from '../../types';

interface BoardState {
  currentBoard: Board | null;
  lists: BoardList[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  currentBoard: null,
  lists: [],
  isLoading: false,
  error: null,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setCurrentBoard: (state, action: PayloadAction<Board>) => {
      state.currentBoard = action.payload;
    },
    setLists: (state, action: PayloadAction<BoardList[]>) => {
      state.lists = action.payload;
    },
    addList: (state, action: PayloadAction<BoardList>) => {
      state.lists.push(action.payload);
    },
    updateList: (state, action: PayloadAction<BoardList>) => {
      state.lists = state.lists.map((l) =>
        l.id === action.payload.id ? action.payload : l
      );
    },
    deleteList: (state, action: PayloadAction<string>) => {
      state.lists = state.lists.filter((l) => l.id !== action.payload);
    },
    addTask: (state, action: PayloadAction<Task>) => {
      const list = state.lists.find((l) => l.id === action.payload.listId);
      if (list) {
        if (!list.tasks) list.tasks = [];
        list.tasks.push(action.payload);
      }
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      state.lists.forEach((list) => {
        if (list.tasks) {
          list.tasks = list.tasks.map((t) =>
            t.id === action.payload.id ? action.payload : t
          );
        }
      });
    },
    deleteTask: (state, action: PayloadAction<{ taskId: string, listId: string }>) => {
      const list = state.lists.find((l) => l.id === action.payload.listId);
      if (list && list.tasks) {
        list.tasks = list.tasks.filter((t) => t.id !== action.payload.taskId);
      }
    },
    moveTask: (state, action: PayloadAction<{ taskId: string, sourceListId: string, destListId: string, destIndex: number }>) => {
        const { taskId, sourceListId, destListId, destIndex } = action.payload;
        const sourceList = state.lists.find(l => l.id === sourceListId);
        const destList = state.lists.find(l => l.id === destListId);
        
        if (sourceList && destList && sourceList.tasks) {
            const taskIndex = sourceList.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const [task] = sourceList.tasks.splice(taskIndex, 1);
                task.listId = destListId;
                if (!destList.tasks) destList.tasks = [];
                destList.tasks.splice(destIndex, 0, task);
            }
        }
    },
    reorderLists: (state, action: PayloadAction<string[]>) => {
        const listIds = action.payload;
        state.lists.sort((a, b) => listIds.indexOf(a.id) - listIds.indexOf(b.id));
    }
  },
});

export const { 
    setCurrentBoard, 
    setLists, 
    addList, 
    updateList, 
    deleteList, 
    addTask, 
    updateTask, 
    deleteTask,
    moveTask,
    reorderLists
} = boardSlice.actions;
export default boardSlice.reducer;
