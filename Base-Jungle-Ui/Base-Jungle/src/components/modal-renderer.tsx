import { useModal } from "@/contexts/modal-context";
import {
  AirlockModal,
  SeedingModal,
  HarvestModal,
  DepositModal,
  StrategyChangeModal,
  LeverageControlModal,
} from "./modals";

export function ModalRenderer() {
  const { activeModal } = useModal();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === "airlock" && <AirlockModal />}
      {activeModal === "seeding" && <SeedingModal />}
      {activeModal === "harvest" && <HarvestModal />}
      {activeModal === "deposit" && <DepositModal />}
      {activeModal === "strategyChange" && <StrategyChangeModal />}
      {activeModal === "leverage-control" && <LeverageControlModal />}
    </>
  );
}
