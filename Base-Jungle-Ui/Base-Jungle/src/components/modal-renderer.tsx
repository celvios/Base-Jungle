import { useModal } from "@/contexts/modal-context";
import {
  AirlockModal,
  SeedingModal,
  HarvestModal,
  DepositModal,
  WithdrawModal,
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
      {activeModal === "withdraw" && <WithdrawModal />}
      {activeModal === "strategyChange" && <StrategyChangeModal />}
      {activeModal === "leverage-control" && <LeverageControlModal />}
    </>
  );
}
