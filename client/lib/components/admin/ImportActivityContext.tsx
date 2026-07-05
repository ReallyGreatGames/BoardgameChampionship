import { createContext, PropsWithChildren, useContext, useState } from "react";

type ImportActivityContextValue = {
  /** Whether an import/delete operation is actively running somewhere in the admin dashboard. */
  busy: boolean;
  setBusy: (busy: boolean) => void;
};

const ImportActivityContext = createContext<ImportActivityContextValue>({
  busy: false,
  setBusy: () => {},
});

export function ImportActivityProvider({ children }: PropsWithChildren) {
  const [busy, setBusy] = useState(false);
  return (
    <ImportActivityContext.Provider value={{ busy, setBusy }}>
      {children}
    </ImportActivityContext.Provider>
  );
}

export function useImportActivity() {
  return useContext(ImportActivityContext);
}
