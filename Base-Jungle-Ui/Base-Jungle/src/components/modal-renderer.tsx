import { useModal } from "@/contexts/modal-context";
import { AirlockModal } from "./modals/airlock-modal";
import { SeedingModal } from "./modals/seeding-modal";
import { HarvestModal } from "./modals/harvest-modal";
import { StrategyChangeModal } from "./modals/strategy-change-modal";
import { DepositModal } from "./modals/deposit-modal";

export function ModalRenderer() {
  const { activeModal, modalData } = useModal();

  switch (activeModal) {
    case "airlock":
      return <AirlockModal />;
    case "seeding":
      return <SeedingModal />;
    case "harvest":
      return <HarvestModal isMature={modalData.isMature !== false} />;
    case "deposit":
      return <DepositModal />;
    case "strategyChange":
      return <StrategyChangeModal {...(modalData as any)} />;
    default:
      return null;
  }
}
