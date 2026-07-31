"use client";

import Image from "next/image";
import React, { useState } from "react";

export type PoioDaVacaTicketProps = {
  organizationName?: string;
  organizationSubtitle?: string;
  logoUrl?: string;
  mascotUrl?: string | null;
  theme?: {
    mainBackground?: string;
    gridBackground?: string;
    cellBackground?: string;
    mainTextColor?: string;
    gridTextColor?: string;
    accentColor?: string;
    borderColor?: string;
    cowColor?: string;
  };
  content?: {
    raffleTitle?: string;
    raffleSubtitle?: string;
    gridTitle?: string;
    gridSubtitle?: string;
    footerMessage?: string;
    legalText?: string;
    cowMessage?: string;
    participantSectionTitle?: string;
  };
  fields?: {
    showName?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showAddress?: boolean;
    showNIF?: boolean;
    nameLabel?: string;
    phoneLabel?: string;
    emailLabel?: string;
    addressLabel?: string;
    nifLabel?: string;
    fieldStyle?: "underline" | "boxed" | "minimal";
    labelPosition?: "left" | "top";
  };
  data?: {
    gridSize?: number; // 5x5, 7x7, etc.
    price?: string;
    cowNumber?: number; // The winning number
  };
  layout?: {
    borderRadius?: "none" | "small" | "medium" | "large";
    shadow?: "none" | "small" | "medium" | "large";
  };
  extras?: {
    showQRCode?: boolean;
    qrCodeValue?: string;
    showWatermark?: boolean;
    watermarkText?: string;
    showDecorativeElements?: boolean;
  };
  onFieldChange?: (field: string, value: string) => void;
  onPrint?: () => void;
  onValidate?: () => void;
};

export default function PoioDaVacaTicket({
  organizationName = "ASSOCIAÇÃO CULTURAL E DESPORTIVA",
  organizationSubtitle = "POIO DA VACA - ANGARIAÇÃO DE FUNDOS 2026",
  logoUrl,
  mascotUrl,
  theme = {
    mainBackground: "#8b4513", // SaddleBrown
    gridBackground: "#f5deb3", // Wheat
    cellBackground: "#ffffff",
    mainTextColor: "#ffffff",
    gridTextColor: "#8b4513",
    accentColor: "#d2691e", // Chocolate
    borderColor: "#a0522d", // Sienna
    cowColor: "#ffffff",
  },
  content = {
    raffleTitle: "POIO DA VACA SOLIDÁRIO",
    raffleSubtitle: "APOSTE NO NÚMERO ONDE A VACA VAZAR!",
    gridTitle: "TERRENO DO POIO",
    gridSubtitle: "Escolha o seu número da sorte",
    footerMessage: "OBRIGADO POR APOIAR A NOSSA INSTITUIÇÃO!",
    legalText: "Os dados serão tratados em conformidade com o RGPD.",
    cowMessage: "O número vencedor será aquele onde a vaca fazer o seu 'poio'!",
    participantSectionTitle: "DADOS DO PARTICIPANTE"
  },
  fields = {
    showName: true,
    showPhone: true,
    showEmail: false,
    showAddress: false,
    showNIF: false,
    nameLabel: "NOME COMPLETO:",
    phoneLabel: "CONTACTO TELEFÓNICO:",
    emailLabel: "EMAIL:",
    addressLabel: "MORADA:",
    nifLabel: "NIF (para fatura):",
    fieldStyle: "underline",
    labelPosition: "left"
  },
  data = {
    gridSize: 5, // 5x5 grid = 25 numbers
    price: "2€",
    cowNumber: Math.floor(Math.random() * 25) + 1, // Random winning number
  },
  layout = {
    borderRadius: "medium",
    shadow: "large"
  },
  extras = {
    showQRCode: false,
    qrCodeValue: "",
    showWatermark: false,
    watermarkText: "ORIGINAL",
    showDecorativeElements: true
  },
  onFieldChange,
  onPrint,
  onValidate
}: PoioDaVacaTicketProps) {
  
  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    nif: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    onFieldChange?.(field, value);
  };

  const getBgStyle = (color?: string) => color?.startsWith("#") ? { backgroundColor: color } : {};
  const getTextStyle = (color?: string) => color?.startsWith("#") ? { color: color } : {};

  const generateGridNumbers = (size: number) => {
    const numbers = [];
    for (let i = 1; i <= size * size; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const gridNumbers = generateGridNumbers(data.gridSize || 5);
  const cowNumber = data.cowNumber || 1;

  const radiusClass = {
    none: "rounded-none",
    small: "rounded",
    medium: "rounded-lg",
    large: "rounded-xl"
  }[layout.borderRadius || "medium"];

  const shadowClass = {
    none: "",
    small: "shadow",
    medium: "shadow-lg",
    large: "shadow-2xl"
  }[layout.shadow || "large"];

  const renderField = (id: string, label: string, value: string, onChange: (val: string) => void, show?: boolean) => {
    if (!show) return null;

    const inputClasses = {
      underline: "border-b-2 border-dashed bg-transparent w-full py-1 focus:outline-none focus:border-solid",
      boxed: "border-2 rounded px-2 py-1 w-full focus:outline-none focus:ring-2",
      minimal: "border-b bg-transparent w-full py-1 focus:outline-none"
    }[fields.fieldStyle || "underline"];

    if (fields.labelPosition === "top") {
      return (
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1" style={getTextStyle(theme.mainTextColor)}>
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            style={{ borderColor: theme.mainTextColor, color: theme.mainTextColor }}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-bold whitespace-nowrap w-32" style={getTextStyle(theme.mainTextColor)}>
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
          style={{ borderColor: theme.mainTextColor, color: theme.mainTextColor }}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 font-sans">
      <div 
        className={`relative overflow-hidden ${radiusClass} ${shadowClass} border-2`}
        style={{ 
          borderColor: theme.borderColor,
          minHeight: "480px"
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 p-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" width={64} height={64} unoptimized className="w-16 h-16 object-contain rounded-lg bg-foreground/20 p-2" />
              ) : (
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  {organizationName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black leading-tight" style={getTextStyle(theme.mainTextColor)}>
                  {organizationName}
                </h1>
                <p className="text-sm font-medium opacity-90" style={getTextStyle(theme.mainTextColor)}>
                  {organizationSubtitle}
                </p>
              </div>
            </div>

            <div 
              className="px-4 py-2 rounded-lg font-mono text-lg font-bold border-2"
              style={{ 
                backgroundColor: theme.accentColor || "#d2691e",
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.3)"
              }}
            >
              Nº {Math.floor(Math.random() * 90000) + 10000}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4 p-6">
            <h2 className="text-2xl font-black mb-1" style={{ color: theme.accentColor || theme.mainTextColor }}>
              {content.raffleTitle}
            </h2>
            <p className="text-lg font-semibold" style={getTextStyle(theme.mainTextColor)}>
              {content.raffleSubtitle}
            </p>
          </div>

          {/* Grid */}
          <div className="flex-1 p-6 relative" style={getBgStyle(theme.mainBackground)}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-black mb-1" style={getTextStyle(theme.mainTextColor)}>
                {content.gridTitle}
              </h3>
              <p className="text-lg font-semibold" style={getTextStyle(theme.gridTextColor)}>
                {content.gridSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-2">
              {gridNumbers.map(number => {
                const isCowNumber = number === cowNumber;
                return (
                  <div 
                    key={number}
                    className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xl cursor-pointer transition-all duration-200 ${
                      isCowNumber 
                        ? `border-4 border-${(theme.cowColor || "#ffffff").replace('#', '')} bg-${(theme.cowColor || "#ffffff").replace('#', '')}/20` 
                        : `border-2 border-${(theme.gridTextColor || "#8b4513").replace('#', '')} bg-${(theme.cellBackground || "#ffffff").replace('#', '')}`}
                    }`}
                    onClick={() => {
                      if (isCowNumber) {
                        alert("PARABÉNS! Você encontrou o número da vaca! 🐄💩");
                      } else {
                        alert("Tente novamente! Continue à procura do número onde a vaca vai fazer o poio.");
                      }
                    }}
                  >
                    <div className="flex items-center justify-center">
                      {number}
                      {isCowNumber && (
                        <span className="text-2xl">🐄</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <div className="p-6" style={{ backgroundColor: theme.gridBackground || "#f5deb3" }}>
            <p className="text-xs font-bold mb-3 pb-1 border-b" style={{ 
              color: theme.gridTextColor || "#8b4513", 
              borderColor: theme.borderColor || "#a0522d" 
            }}>
              {content.participantSectionTitle}
            </p>

            {renderField("name", fields.nameLabel || "", formValues.name, (v) => handleInputChange("name", v), fields.showName)}
            {renderField("phone", fields.phoneLabel || "", formValues.phone, (v) => handleInputChange("phone", v), fields.showPhone)}
            {renderField("email", fields.emailLabel || "", formValues.email, (v) => handleInputChange("email", v), fields.showEmail)}
            {renderField("address", fields.addressLabel || "", formValues.address, (v) => handleInputChange("address", v), fields.showAddress)}
            {renderField("nif", fields.nifLabel || "", formValues.nif, (v) => handleInputChange("nif", v), fields.showNIF)}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center p-6" style={{ backgroundColor: theme.gridBackground || "#f5deb3" }}>
            <p className="text-sm font-bold" style={getTextStyle(theme.mainTextColor)}>
              {content.footerMessage}
            </p>
            {content.legalText && (
              <p className="text-xs mt-1 opacity-70" style={getTextStyle(theme.mainTextColor)}>
                {content.legalText}
              </p>
            )}
          </div>

          {/* Decorative elements */}
          {extras.showDecorativeElements && (
            <>
              <div className="absolute top-4 right-4 text-4xl opacity-20">🎉</div>
              <div className="absolute bottom-4 left-4 text-3xl opacity-20">🎊</div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-center no-print">
        <button onClick={onPrint || (() => window.print())} className="px-6 py-2 bg-gray-800 text-foreground rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2">
          🖨️ Imprimir Poio da Vaca
        </button>
        {onValidate && (
          <button onClick={onValidate} className="px-6 py-2 bg-primary text-foreground rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
            ✅ Validar
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 no-print">
        <p>Dimensões: 210mm × 148mm (A5) | Papel recomendado: 120-150g/m²</p>
      </div>
    </div>
  );
}