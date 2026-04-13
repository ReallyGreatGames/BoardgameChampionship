import { FC, PropsWithChildren } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { TournamentProvider } from "./TournamentProvider";
import { AuthProvider } from "../auth";
import { PlayerProvider } from "./PlayerProvider";

const queryClient = new QueryClient();

export const BootstrapProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TournamentProvider>
        <AuthProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </AuthProvider>
      </TournamentProvider>
    </QueryClientProvider>
  );
};
