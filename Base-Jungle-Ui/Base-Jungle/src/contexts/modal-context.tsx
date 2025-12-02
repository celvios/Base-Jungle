import { createContext, useContext, useState } from "react";

export type ModalType =
  | "airlock"
  | "seeding"
  | "harvest"
  | "deposit"
  | "strategyChange"
  | "leverage-control"
  | "x-ray"
  | "field-journal"
  | "referral-beacon"
  | null;

interface ModalContextType {
  activeModal: ModalType;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  modalData: Record<string, unknown>;
  setModalData: (data: Record<string, unknown>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<Record<string, unknown>>({});

  const openModal = (modal: ModalType, data?: Record<string, unknown>) => {
    setActiveModal(modal);
    if (data) {
      setModalData(data);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
  };

  return (
    <ModalContext.Provider
      value={{ activeModal, openModal, closeModal, modalData, setModalData }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
