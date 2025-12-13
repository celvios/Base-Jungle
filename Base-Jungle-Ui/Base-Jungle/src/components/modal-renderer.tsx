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
  const { activeModal, modalData } = useModal();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === "airlock" && <AirlockModal />}
      {activeModal === "seeding" && <SeedingModal />}
      {activeModal === "harvest" && <HarvestModal {...(modalData as any)} />}
      {activeModal === "deposit" && <DepositModal />}
      {activeModal === "withdraw" && <WithdrawModal {...(modalData as any)} />}
      {activeModal === "strategyChange" && <StrategyChangeModal {...(modalData as any)} />}
      {activeModal === "leverage-control" && <LeverageControlModal />}
    </>
  );
}
