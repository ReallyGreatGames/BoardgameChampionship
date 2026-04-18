import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren } from "react";
import { AuthProvider } from "../auth";
import { DialogProvider } from "../components/Dialog";
import { PlayerProvider } from "./PlayerProvider";
import { RealTimeStoreProvider } from "./RealTimeStoreProvider";
import { ScreenOrientationProvider } from "./ScreenOrientationProvider";
import { ThemeProvider } from "./ThemeProvider";
import { TournamentProvider } from "./TournamentProvider";

const queryClient = new QueryClient();

export const BootstrapProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider>
      <DialogProvider>
        <QueryClientProvider client={queryClient}>
          <TournamentProvider>
            <AuthProvider>
              <RealTimeStoreProvider />
              <ScreenOrientationProvider>
                <PlayerProvider>{children}</PlayerProvider>
              </ScreenOrientationProvider>
            </AuthProvider>
          </TournamentProvider>
        </QueryClientProvider>
      </DialogProvider>
    </ThemeProvider>
  );
};
