"use client";

import React, { useState } from "react";

export type TombolaTicketProps = {
  organizationName?: string;
  organizationSubtitle?: string;
  logoUrl?: string;
  mascotUrl?: string | null;
  theme?: {
    mainBackground?: string;
    cardBackground?: string;
    numberBackground?: string;
    mainTextColor?: string;
    cardTextColor?: string;
    accentColor?: string;
    borderColor?: string;
  };
  content?: {
    raffleTitle?: string;
    raffleSubtitle?: string;
    participantSectionTitle?: string;
    nameLabel?: string;
    phoneLabel?: string;
    emailLabel?: string;
    addressLabel?: string;
    nifLabel?: string;
    footerMessage?: string;
    legalText?: string;
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
    ticketNumber?: string;
    tombolaNumbers?: number[]; // Numbers on the tombola card
    price?: string;
    drawDate?: string;
    drawTime?: string;
    drawLocation?: string;
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

export default function TombolaTicket({
  organizationName = "ASSOCIAÇÃO CULTURAL E DESPORTIVA",
  organizationSubtitle = "TOMBOLA SOLIDÁRIA - ANGARIAÇÃO DE FUNDOS 2026",
  logoUrl,
  mascotUrl,
  theme = {
    mainBackground: "#1e3a8a", // Blue-800
    cardBackground: "#ffffff",
    numberBackground: "#f3f4f6", // Gray-100
    mainTextColor: "#ffffff",
    cardTextColor: "#1f2937", // Gray-800
    accentColor: "#fbbf24", // Amber-300
    borderColor: "#e5e7eb", // Gray-200
  },
  content = {
    raffleTitle: "TOMBOLA SOLIDÁRIA",
    raffleSubtitle: "CADA NÚMERO É UMA CHANCE DE GANHAR!",
    participantSectionTitle: "DADOS DO PARTICIPANTE",
    nameLabel: "NOME COMPLETO:",
    phoneLabel: "CONTACTO TELEFÓNICO:",
    emailLabel: "EMAIL:",
    addressLabel: "MORADA:",
    nifLabel: "NIF (para fatura):",
    footerMessage: "OBRIGADO POR APOIAR A NOSSA INSTITUIÇÃO!",
    legalText: "Os dados serão tratados em conformidade com o RGPD."
  },
  fields = {
    showName: true,
    showPhone: true,
    showEmail: false,
    showAddress: false,
    showNIF: false,
    nameLabel: "NOME:",
    phoneLabel: "TELEMÓVEL:",
    emailLabel: "EMAIL:",
    addressLabel: "MORADA:",
    nifLabel: "NIF (para fatura):",
    fieldStyle: "underline",
    labelPosition: "left"
  },
  data = {
    ticketNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
    tombolaNumbers: Array.from({ length: 15 }, () => Math.floor(Math.random() * 90) + 1), // 15 random numbers 1-90
    price: "3€",
    drawDate: "15/08/2026",
    drawTime: "21:30",
    drawLocation: "Salão Paroquial"
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
}: TombolaTicketProps) {
  
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
        className="relative overflow-hidden rounded-lg shadow-lg border-2"
        style={{ 
          borderColor: theme.borderColor,
          minHeight: "500px"
        }}
      >
        <div className="flex h-full">
          {/* Left Side - Info */}
          <div className="flex-1 p-6" style={getBgStyle(theme.mainBackground)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-foreground/20 p-2" />
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
                  backgroundColor: theme.accentColor,
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)"
                }}
              >
                Nº {data.ticketNumber}
              </div>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-2xl font-black mb-1" style={{ color: theme.accentColor || theme.mainTextColor }}>
                {content.raffleTitle}
              </h2>
              <p className="text-lg font-semibold" style={getTextStyle(theme.mainTextColor)}>
                {content.raffleSubtitle}
              </p>
            </div>

            {/* Tombola Card */}
            <div className="relative">
              <div className="bg-foreground/10 rounded-xl p-4" style={{ borderColor: "rgba(255,255,255,0.2)", borderWidth: "1px" }}>
                <h3 className="text-lg font-bold mb-4 text-center" style={{ color: theme.mainTextColor }}>
                  Seus Números da Sorte
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {data.tombolaNumbers?.map((number, index) => (
                    <div 
                      key={index}
                      className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xl bg-${(theme.numberBackground || "#f3f4f6").replace('#', '')} border-2 border-${(theme.borderColor || "#e5e7eb").replace('#', '')}`}
                    >
                      {number.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prize Info */}
            <div className="mt-6 p-4 bg-foreground/10 rounded-xl" style={{ borderColor: "rgba(255,255,255,0.2)", borderWidth: "1px" }}>
              <p className="text-sm font-bold mb-2" style={{ color: theme.mainTextColor }}>
                Prémios:
              </p>
              <div className="space-y-1 text-sm" style={{ color: theme.mainTextColor }}>
                <p>• 1º Lugar: Vale 500€ + Cabaz Produtos</p>
                <p>• 2º Lugar: Vale 200€ + Cabaz Produtos</p>
                <p>• 3º Lugar: Vale 100€ + Cabaz Produtos</p>
                <p>• 4-10º Lugar: Cabaz de Produtos Locais</p>
              </div>
            </div>

            {/* Draw Info */}
            <div className="mt-4 p-4 bg-foreground/10 rounded-xl" style={{ borderColor: "rgba(255,255,255,0.2)", borderWidth: "1px" }}>
              <p className="text-sm font-bold mb-2" style={{ color: theme.mainTextColor }}>
                Informações do Sorteio:
              </p>
              <div className="space-y-1 text-sm" style={{ color: theme.mainTextColor }}>
                <p>📅 Data: {data.drawDate}</p>
                <p>🕐 Hora: {data.drawTime}</p>
                <p>📍 Local: {data.drawLocation}</p>
                <p>💶 Preço: {data.price}</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-64 p-6" style={{ backgroundColor: theme.cardBackground }}>
            <p className="text-xs font-bold mb-3 pb-1 border-b" style={{ color: theme.cardTextColor, borderColor: theme.borderColor }}>
              {content.participantSectionTitle}
            </p>

            {renderField("name", fields.nameLabel || "", formValues.name, (v) => handleInputChange("name", v), fields.showName)}
            {renderField("phone", fields.phoneLabel || "", formValues.phone, (v) => handleInputChange("phone", v), fields.showPhone)}
            {renderField("email", fields.emailLabel || "", formValues.email, (v) => handleInputChange("email", v), fields.showEmail)}
            {renderField("address", fields.addressLabel || "", formValues.address, (v) => handleInputChange("address", v), fields.showAddress)}
            {renderField("nif", fields.nifLabel || "", formValues.nif, (v) => handleInputChange("nif", v), fields.showNIF)}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center p-6" style={{ backgroundColor: theme.cardBackground }}>
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

      <div className="mt-6 flex gap-3 justify-center no-print">
        <button onClick={onPrint || (() => window.print())} className="px-6 py-2 bg-gray-800 text-foreground rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2">
          🖨️ Imprimir Tombola
        </button>
        {onValidate && (
          <button onClick={onValidate} className="px-6 py-2 bg-primary text-foreground rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
            ✅ Validar
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 no-print">
        <p>Dimensões: 148mm × 210mm (A5 vertical) | Papel recomendado: 120-150g/m²</p>
      </div>
    </div>
  );
}