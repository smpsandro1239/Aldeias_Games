"use client";
import { useState } from "react";

import type { Evento, Jogo, Vencedor } from "../components/types";
import type { JogoData } from "@/components/modals/create-jogo-modal";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";

export default function useAdminModals() {
  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [jogoModalOpen, setJogoModalOpen] = useState(false);
  const [aldeiaModalOpen, setAldeiaModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [convertPrizeOpen, setConvertPrizeOpen] = useState(false);
  const [confirmEntregaOpen, setConfirmEntregaOpen] = useState(false);
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [resultadosExternosOpen, setResultadosExternosOpen] = useState(false);
  const [testJogoOpen, setTestJogoOpen] = useState(false);

  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedJogo, setSelectedJogo] = useState<JogoData | null>(null);
  const [selectedAldeia, setSelectedAldeia] = useState<AldeiaData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedPremio, setSelectedPremio] = useState<Vencedor | null>(null);
  const [convertValor, setConvertValor] = useState("25");
  const [qrCodeData, setQrCodeData] = useState<{ jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null>(null);
  const [testJogo, setTestJogo] = useState<Jogo | null>(null);
  const [testJogoTotalParticipacoes, setTestJogoTotalParticipacoes] = useState(0);
  const [deleteData, setDeleteData] = useState<{ type: string; id: string } | null>(null);
  const [toggleJogoData, setToggleJogoData] = useState<{ jogo: Jogo; novoEstado: 'aberto' | 'fechado' } | null>(null);

  return {
    eventoModalOpen,
    setEventoModalOpen,
    jogoModalOpen,
    setJogoModalOpen,
    aldeiaModalOpen,
    setAldeiaModalOpen,
    userModalOpen,
    setUserModalOpen,
    convertPrizeOpen,
    setConvertPrizeOpen,
    confirmEntregaOpen,
    setConfirmEntregaOpen,
    verificarHashOpen,
    setVerificarHashOpen,
    qrCodeOpen,
    setQrCodeOpen,
    resultadosExternosOpen,
    setResultadosExternosOpen,
    testJogoOpen,
    setTestJogoOpen,
    selectedEvento,
    setSelectedEvento,
    selectedJogo,
    setSelectedJogo,
    selectedAldeia,
    setSelectedAldeia,
    selectedUser,
    setSelectedUser,
    selectedPremio,
    setSelectedPremio,
    convertValor,
    setConvertValor,
    qrCodeData,
    setQrCodeData,
    testJogo,
    setTestJogo,
    testJogoTotalParticipacoes,
    setTestJogoTotalParticipacoes,
    deleteData,
    setDeleteData,
    toggleJogoData,
    setToggleJogoData,
  };
}
