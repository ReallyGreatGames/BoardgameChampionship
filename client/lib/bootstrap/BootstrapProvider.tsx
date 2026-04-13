import { FC, PropsWithChildren } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { TournamentProvider } from "./TournamentProvider";
import { AuthProvider } from "../auth";
import { PlayerProvider } from "./PlayerProvider";
import { ScreenOrientationProvider } from "./ScreenOrientationProvider";

const queryClient = new QueryClient();

export const BootstrapProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TournamentProvider>
        <AuthProvider>
          <ScreenOrientationProvider>
            <PlayerProvider>{children}</PlayerProvider>
          </ScreenOrientationProvider>
        </AuthProvider>
      </TournamentProvider>
    </QueryClientProvider>
  );
};
