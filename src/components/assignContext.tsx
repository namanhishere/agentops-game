import { createContext, ReactNode, useContext, useState } from "react";

interface AssignState {
  taskId: string | null;
  open: (taskId: string) => void;
  close: () => void;
}

const AssignContext = createContext<AssignState>({
  taskId: null,
  open: () => {},
  close: () => {},
});

export function AssignProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  return (
    <AssignContext.Provider
      value={{
        taskId,
        open: (id) => setTaskId(id),
        close: () => setTaskId(null),
      }}
    >
      {children}
    </AssignContext.Provider>
  );
}

export const useAssign = () => useContext(AssignContext);
