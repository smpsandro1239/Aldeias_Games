"use client";

import React, { useState } from "react";

export type UltimateRaffleTicketProps = {
  organizationName?: string;
  organizationSubtitle?: string;
  logoUrl?: string;
  mascotUrl?: string | null;
  theme?: {
    mainBackground?: string;
    stubBackground?: string;
    formBackground?: string;
    mainTextColor?: string;
    stubTextColor?: string;
    formTextColor?: string;
    accentTextColor?: string;
    primaryAccent?: string;
    secondaryAccent?: string;
    borderColor?: string;
    perforationColor?: string;
    useGradient?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: "to-r" | "to-l" | "to-t" | "to-b";
  };
  content?: {
    raffleTitle?: string;
    raffleSubtitle?: string;
    prizeSectionTitle?: string;
    prizeName?: string;
    prizeDescription?: string;
    participantSectionTitle?: string;
    nameLabel?: string;
    phoneLabel?: string;
    emailLabel?: string;
    addressLabel?: string;
    nifLabel?: string;
    footerMessage?: string;
    legalText?: string;
    stubTitle?: string;
    stubTicketLabel?: string;
    stubThanksMessage?: string;
    stubInstructions?: string;
  };
  fields?: {
    showName?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showAddress?: boolean;
    showNIF?: boolean;
    showAdditionalInfo?: boolean;
    additionalInfoLabel?: string;
    fieldStyle?: "underline" | "boxed" | "minimal";
    labelPosition?: "left" | "top";
  };
  data?: {
    ticketNumber?: string;
    ticketPrefix?: string;
    drawDate?: string;
    drawTime?: string;
    drawLocation?: string;
    price?: string;
  };
  layout?: {
    orientation?: "horizontal" | "vertical";
    stubPosition?: "right" | "left" | "bottom";
    stubWidth?: "narrow" | "normal" | "wide";
    showPerforation?: boolean;
    perforationStyle?: "dashed" | "dotted" | "scissors" | "zigzag";
    borderRadius?: "none" | "small" | "medium" | "large";
    shadow?: "none" | "small" | "medium" | "large";
  };
  extras?: {
    showQRCode?: boolean;
    qrCodeValue?: string;
    showBarcode?: boolean;
    barcodeValue?: string;
    showWatermark?: boolean;
    watermarkText?: string;
    showSecurityPattern?: boolean;
    showPrizeImage?: boolean;
    prizeImageUrl?: string;
    showDecorativeElements?: boolean;
  };
  onFieldChange?: (field: string, value: string) => void;
  onPrint?: () => void;
  onValidate?: () => void;
};

export default function UltimateRaffleTicket({
  organizationName = "ASSOCIAÇÃO CULTURAL E DESPORTIVA",
  organizationSubtitle = "RIFA DE ANGARIAÇÃO DE FUNDOS 2026",
  logoUrl,
  mascotUrl,
  theme = {
    mainBackground: "#1e3a8a",
    stubBackground: "#fbbf24",
    formBackground: "#ffffff",
    mainTextColor: "#ffffff",
    stubTextColor: "#1f2937",
    formTextColor: "#374151",
    accentTextColor: "#fbbf24",
    primaryAccent: "#dc2626",
    secondaryAccent: "#059669",
    borderColor: "#e5e7eb",
    perforationColor: "#9ca3af",
    useGradient: false,
    gradientFrom: "#1e3a8a",
    gradientTo: "#3b82f6",
    gradientDirection: "to-r"
  },
  content = {
    raffleTitle: "GRANDE RIFA SOLIDÁRIA",
    raffleSubtitle: "PARTICIPE E AJUDE A NOSSA CAUSA",
    prizeSectionTitle: "PRÉMIO PRINCIPAL",
    prizeName: "Vale de 500€ + Cabaz de Produtos Locais",
    prizeDescription: "Sorteio a realizar no dia 15 de Agosto de 2026",
    participantSectionTitle: "DADOS DO PARTICIPANTE",
    nameLabel: "NOME COMPLETO:",
    phoneLabel: "CONTACTO TELEFÓNICO:",
    emailLabel: "EMAIL:",
    addressLabel: "MORADA:",
    nifLabel: "NIF (para fatura):",
    footerMessage: "OBRIGADO POR APOIAR A NOSSA INSTITUIÇÃO!",
    legalText: "Os dados serão tratados em conformidade com o RGPD.",
    stubTitle: "TALÃO DE PARTICIPAÇÃO",
    stubTicketLabel: "Nº DO TALÃO",
    stubThanksMessage: "Obrigado pela sua contribuição!",
    stubInstructions: "Apresente este talão no dia do sorteio"
  },
  fields = {
    showName: true,
    showPhone: true,
    showEmail: false,
    showAddress: false,
    showNIF: false,
    showAdditionalInfo: false,
    additionalInfoLabel: "INFORMAÇÃO ADICIONAL:",
    fieldStyle: "underline",
    labelPosition: "left"
  },
  data = {
    ticketNumber: "00001",
    ticketPrefix: "",
    drawDate: "15/08/2026",
    drawTime: "21:00",
    drawLocation: "Salão Paroquial",
    price: "5€"
  },
  layout = {
    orientation: "horizontal",
    stubPosition: "right",
    stubWidth: "normal",
    showPerforation: true,
    perforationStyle: "scissors",
    borderRadius: "medium",
    shadow: "large"
  },
  extras = {
    showQRCode: false,
    qrCodeValue: "",
    showBarcode: false,
    barcodeValue: "",
    showWatermark: false,
    watermarkText: "ORIGINAL",
    showSecurityPattern: false,
    showPrizeImage: false,
    prizeImageUrl: "",
    showDecorativeElements: true
  },
  onFieldChange,
  onPrint,
  onValidate
}: UltimateRaffleTicketProps) {

  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    nif: "",
    additional: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    onFieldChange?.(field, value);
  };

  const getBgStyle = (color?: string) => color?.startsWith("#") ? { backgroundColor: color } : {};
  const getTextStyle = (color?: string) => color?.startsWith("#") ? { color: color } : {};

  const fullTicketNumber = `${data.ticketPrefix || ""}${data.ticketNumber || "00001"}`;

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

  const stubWidthClass = {
    narrow: "w-40",
    normal: "w-48",
    wide: "w-56"
  }[layout.stubWidth || "normal"];

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
          <label className="block text-xs font-bold mb-1" style={getTextStyle(theme.formTextColor)}>
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            style={{ borderColor: theme.formTextColor, color: theme.formTextColor }}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-bold whitespace-nowrap w-32" style={getTextStyle(theme.formTextColor)}>
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
          style={{ borderColor: theme.formTextColor, color: theme.formTextColor }}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-sans">
      <div 
        className={`relative overflow-hidden ${radiusClass} ${shadowClass} border-2`}
        style={{ 
          borderColor: theme.borderColor,
          minHeight: layout.orientation === "horizontal" ? "320px" : "auto"
        }}
      >
        <div className="flex h-full" style={{ flexDirection: layout.stubPosition === "left" ? "row-reverse" : "row" }}>
          <div 
            className="flex-1 p-6 relative"
            style={theme.useGradient ? {
              background: `linear-gradient(${theme.gradientDirection}, ${theme.gradientFrom}, ${theme.gradientTo})`
            } : getBgStyle(theme.mainBackground)}
          >
            {extras.showSecurityPattern && (
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)`
                }} />
              </div>
            )}

            {extras.showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-6xl font-black transform -rotate-45">{extras.watermarkText}</span>
              </div>
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/20 p-2" />
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
                  backgroundColor: theme.primaryAccent,
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)"
                }}
              >
                {content.stubTicketLabel} {fullTicketNumber}
              </div>
            </div>

            <div className="text-center mb-4 relative z-10">
              <h2 className="text-2xl font-black mb-1" style={{ color: theme.accentTextColor || theme.mainTextColor }}>
                {content.raffleTitle}
              </h2>
              <p className="text-lg font-semibold" style={getTextStyle(theme.mainTextColor)}>
                {content.raffleSubtitle}
              </p>
            </div>

            <div className="flex gap-4 mb-4 relative z-10">
              <div className="w-32 h-32 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2" style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                {extras.showPrizeImage && extras.prizeImageUrl ? (
                  <img src={extras.prizeImageUrl} alt="Prémio" className="w-full h-full object-cover" />
                ) : mascotUrl ? (
                  <img src={mascotUrl} alt="Mascote" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl">🏆</span>
                    <p className="text-xs mt-1 font-bold" style={getTextStyle(theme.mainTextColor)}>PRÉMIO</p>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="rounded-lg p-3 mb-2 border-l-4" style={{ backgroundColor: "rgba(255,255,255,0.15)", borderLeftColor: theme.accentTextColor || theme.primaryAccent }}>
                  <p className="text-xs font-bold mb-1 opacity-80" style={getTextStyle(theme.mainTextColor)}>
                    {content.prizeSectionTitle}
                  </p>
                  <p className="text-lg font-bold leading-tight" style={getTextStyle(theme.mainTextColor)}>
                    {content.prizeName}
                  </p>
                  <p className="text-sm mt-1 opacity-90" style={getTextStyle(theme.mainTextColor)}>
                    {content.prizeDescription}
                  </p>
                </div>

                <div className="flex gap-4 text-xs" style={getTextStyle(theme.mainTextColor)}>
                  <span>📅 {data.drawDate}</span>
                  <span>🕐 {data.drawTime}</span>
                  <span>📍 {data.drawLocation}</span>
                  {data.price && <span className="font-bold">💶 {data.price}</span>}
                </div>
              </div>
            </div>

            <div className="rounded-lg p-4 relative z-10" style={{ backgroundColor: theme.formBackground }}>
              <p className="text-xs font-bold mb-3 pb-1 border-b" style={{ color: theme.formTextColor, borderColor: theme.borderColor }}>
                {content.participantSectionTitle}
              </p>

              {renderField("name", content.nameLabel || "", formValues.name, (v) => handleInputChange("name", v), fields.showName)}
              {renderField("phone", content.phoneLabel || "", formValues.phone, (v) => handleInputChange("phone", v), fields.showPhone)}
              {renderField("email", content.emailLabel || "", formValues.email, (v) => handleInputChange("email", v), fields.showEmail)}
              {renderField("address", content.addressLabel || "", formValues.address, (v) => handleInputChange("address", v), fields.showAddress)}
              {renderField("nif", content.nifLabel || "", formValues.nif, (v) => handleInputChange("nif", v), fields.showNIF)}
              {renderField("additional", fields.additionalInfoLabel || "", formValues.additional, (v) => handleInputChange("additional", v), fields.showAdditionalInfo)}
            </div>

            <div className="mt-4 text-center relative z-10">
              <p className="text-sm font-bold" style={getTextStyle(theme.mainTextColor)}>
                {content.footerMessage}
              </p>
              {content.legalText && (
                <p className="text-xs mt-1 opacity-70" style={getTextStyle(theme.mainTextColor)}>
                  {content.legalText}
                </p>
              )}
            </div>

            {extras.showDecorativeElements && (
              <>
                <div className="absolute top-4 right-4 text-4xl opacity-20">🎉</div>
                <div className="absolute bottom-4 left-4 text-3xl opacity-20">🎊</div>
              </>
            )}
          </div>

          {layout.showPerforation && (
            <div className="w-6 bg-gray-100 relative flex items-center justify-center" style={{ backgroundColor: "#f3f4f6" }}>
              <svg width="24" height="100%" viewBox="0 0 24 400" preserveAspectRatio="none" className="h-full">
                {layout.perforationStyle === "scissors" ? (
                  <>
                    <text x="12" y="20" textAnchor="middle" fill={theme.perforationColor} fontSize="16">✂️</text>
                    <line x1="12" y1="30" x2="12" y2="400" stroke={theme.perforationColor} strokeWidth="2" strokeDasharray="8 4" />
                  </>
                ) : (
                  <line x1="12" y1="0" x2="12" y2="400" stroke={theme.perforationColor} strokeWidth="2" strokeDasharray={layout.perforationStyle === "dotted" ? "2 4" : "8 4"} />
                )}
                {[...Array(25)].map((_, i) => (
                  <circle key={i} cx="12" cy={i * 16 + 8} r="4" fill="#fff" stroke={theme.perforationColor} strokeWidth="1" />
                ))}
              </svg>
            </div>
          )}

          <div className={`${stubWidthClass} p-4 flex flex-col justify-between`} style={getBgStyle(theme.stubBackground)}>
            <div className="text-center">
              <div className="inline-block px-3 py-1 rounded text-xs font-bold mb-2" style={{ backgroundColor: theme.primaryAccent, color: "#ffffff" }}>
                {content.stubTitle}
              </div>

              {logoUrl && <img src={logoUrl} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain" />}

              <p className="text-xs font-bold leading-tight" style={getTextStyle(theme.stubTextColor)}>
                {organizationName}
              </p>
            </div>

            {extras.showQRCode && (
              <div className="my-3 mx-auto w-20 h-20 bg-white rounded p-1">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">QR</div>
              </div>
            )}

            {extras.showBarcode && (
              <div className="my-2 mx-auto">
                <div className="h-8 bg-gray-800 w-full flex items-end justify-center gap-0.5 px-2">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="bg-white w-0.5" style={{ height: `${Math.random() * 100}%` }} />
                  ))}
                </div>
                <p className="text-center text-xs font-mono mt-1" style={getTextStyle(theme.stubTextColor)}>{fullTicketNumber}</p>
              </div>
            )}

            <div className="text-center py-3 rounded-lg my-3 border-2" style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: theme.primaryAccent }}>
              <p className="text-xs font-bold mb-1" style={getTextStyle(theme.stubTextColor)}>{content.stubTicketLabel}</p>
              <p className="text-3xl font-black font-mono" style={{ color: theme.primaryAccent }}>{fullTicketNumber}</p>
            </div>

            <div className="text-center text-xs py-2 rounded mb-2" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>
              <p className="font-bold" style={getTextStyle(theme.stubTextColor)}>{data.drawDate}</p>
              <p style={getTextStyle(theme.stubTextColor)}>{data.drawTime}</p>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold mb-1" style={getTextStyle(theme.stubTextColor)}>{content.stubThanksMessage}</p>
              <p className="text-xs" style={getTextStyle(theme.stubTextColor)}>{content.stubInstructions}</p>
              <div className="mt-3 pt-2 border-t-2 border-dashed" style={{ borderColor: theme.stubTextColor }}>
                <p className="text-xs" style={getTextStyle(theme.stubTextColor)}>✂️</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-center no-print">
        <button onClick={onPrint || (() => window.print())} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2">
          🖨️ Imprimir Rifa
        </button>
        {onValidate && (
          <button onClick={onValidate} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
            ✅ Validar
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 no-print">
        <p>Dimensões: 210mm × 99mm (1/3 A4) | Papel recomendado: 100-120g/m²</p>
      </div>
    </div>
  );
}