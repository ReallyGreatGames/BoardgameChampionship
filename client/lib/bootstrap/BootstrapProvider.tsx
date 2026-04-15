import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren } from "react";
import { AuthProvider } from "../auth";
import { PlayerProvider } from "./PlayerProvider";
import { TournamentProvider } from "./TournamentProvider";

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
