"use client";

import React from "react";

export type MascotRaffleTicketProps = {
  clubName?: string;
  clubSubtitle?: string;
  logoSrc?: string | null;
  colors?: {
    primary?: string;
    secondary?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
  };
  texts?: {
    title?: string;
    subtitle?: string;
    prizeLabel?: string;
    prizeValue?: string;
    footerText?: string;
    detachableLabel?: string;
    detachableThanks?: string;
    ticketNumberLabel?: string;
  };
  fields?: {
    showName?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showAddress?: boolean;
    nameLabel?: string;
    phoneLabel?: string;
    emailLabel?: string;
    addressLabel?: string;
  };
  ticketNumber?: string;
  prize?: string;
  date?: string;
  orientation?: "horizontal" | "vertical";
  showPerforation?: boolean;
  mascotImage?: string | null;
};

export default function MascotRaffleTicket({
  clubName = "CLUBE DESPORTIVO LOCAL",
  clubSubtitle = "RIFA DE ANGARIAÇÃO DE FUNDOS",
  logoSrc = null,
  colors = {
    primary: "#1e40af",
    secondary: "#fbbf24",
    text: "#ffffff",
    textSecondary: "#1f2937",
    border: "#e5e7eb"
  },
  texts = {
    title: "RIFA SOLIDÁRIA",
    subtitle: "AJUDE O SEU CLUBE",
    prizeLabel: "PRÉMIO:",
    prizeValue: "Bola Oficial + Camisola Assinada",
    footerText: "OBRIGADO PELA SUA CONTRIBUIÇÃO!",
    detachableLabel: "TALÃO",
    detachableThanks: "Obrigado e Boa Sorte!",
    ticketNumberLabel: "Nº"
  },
  fields = {
    showName: true,
    showPhone: true,
    showEmail: false,
    showAddress: false,
    nameLabel: "NOME:",
    phoneLabel: "TELEMÓVEL:",
    emailLabel: "EMAIL:",
    addressLabel: "MORADA:"
  },
  ticketNumber = "00001",
  prize = "Bola Oficial + Camisola",
  date = new Date().toLocaleDateString("pt-PT"),
  orientation = "horizontal",
  showPerforation = true,
  mascotImage = null
}: MascotRaffleTicketProps) {

  const getBgStyle = (color?: string) => color?.startsWith("#") ? { backgroundColor: color } : {};
  const getTextStyle = (color?: string) => color?.startsWith("#") ? { color: color } : {};

  return (
    <div className="w-full max-w-4xl mx-auto p-4 font-sans">
      <div 
        className="relative flex rounded-lg shadow-xl overflow-hidden border-2"
        style={{ 
          borderColor: colors.border,
          minHeight: orientation === "horizontal" ? "280px" : "auto"
        }}
      >
        <div 
          className="flex-1 p-6 relative"
          style={getBgStyle(colors.primary)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <img 
                  src={logoSrc} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-full bg-white/20 p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                  {clubName.charAt(0)}
                </div>
              )}
              <div>
                <h1 
                  className="text-xl font-black tracking-tight"
                  style={getTextStyle(colors.text)}
                >
                  {clubName}
                </h1>
                <p 
                  className="text-sm font-medium opacity-90"
                  style={getTextStyle(colors.text)}
                >
                  {clubSubtitle}
                </p>
              </div>
            </div>

            <div 
              className="px-3 py-1 rounded-lg font-mono text-lg font-bold"
              style={{ 
                backgroundColor: colors.secondary,
                color: colors.textSecondary
              }}
            >
              {texts.ticketNumberLabel} {ticketNumber}
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 
              className="text-2xl font-black mb-1"
              style={getTextStyle(colors.text)}
            >
              {texts.title}
            </h2>
            <p 
              className="text-lg font-semibold"
              style={getTextStyle(colors.text)}
            >
              {texts.subtitle}
            </p>
          </div>

          <div className="flex gap-4 mb-4">
            <div 
              className="w-32 h-32 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: colors.secondary }}
            >
              {mascotImage ? (
                <img 
                  src={mascotImage} 
                  alt="Mascote" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-4xl">⚽🦁</span>
                  <p 
                    className="text-xs mt-1 font-bold"
                    style={getTextStyle(colors.textSecondary)}
                  >
                    MASCOTE
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div 
                className="rounded-lg p-3 mb-2"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <p 
                  className="text-sm font-bold mb-1"
                  style={getTextStyle(colors.text)}
                >
                  {texts.prizeLabel}
                </p>
                <p 
                  className="text-lg font-bold"
                  style={getTextStyle(colors.text)}
                >
                  {texts.prizeValue}
                </p>
              </div>
              <p 
                className="text-xs opacity-80"
                style={getTextStyle(colors.text)}
              >
                Data: {date}
              </p>
            </div>
          </div>

          <div 
            className="space-y-2 rounded-lg p-3"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            {fields.showName && (
              <div className="flex items-center gap-2">
                <label 
                  className="text-sm font-bold w-24"
                  style={getTextStyle(colors.textSecondary)}
                >
                  {fields.nameLabel}
                </label>
                <div 
                  className="flex-1 border-b-2 border-dashed h-8"
                  style={{ borderColor: colors.primary }}
                />
              </div>
            )}

            {fields.showPhone && (
              <div className="flex items-center gap-2">
                <label 
                  className="text-sm font-bold w-24"
                  style={getTextStyle(colors.textSecondary)}
                >
                  {fields.phoneLabel}
                </label>
                <div 
                  className="flex-1 border-b-2 border-dashed h-8"
                  style={{ borderColor: colors.primary }}
                />
              </div>
            )}

            {fields.showEmail && (
              <div className="flex items-center gap-2">
                <label 
                  className="text-sm font-bold w-24"
                  style={getTextStyle(colors.textSecondary)}
                >
                  {fields.emailLabel}
                </label>
                <div 
                  className="flex-1 border-b-2 border-dashed h-8"
                  style={{ borderColor: colors.primary }}
                />
              </div>
            )}

            {fields.showAddress && (
              <div className="flex items-center gap-2">
                <label 
                  className="text-sm font-bold w-24"
                  style={getTextStyle(colors.textSecondary)}
                >
                  {fields.addressLabel}
                </label>
                <div 
                  className="flex-1 border-b-2 border-dashed h-8"
                  style={{ borderColor: colors.primary }}
                />
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <p 
              className="text-sm font-bold"
              style={getTextStyle(colors.text)}
            >
              {texts.footerText}
            </p>
          </div>
        </div>

        {showPerforation && orientation === "horizontal" && (
          <div className="w-4 bg-gray-100 relative flex items-center justify-center">
            <svg 
              width="16" 
              height="100%" 
              viewBox="0 0 16 200" 
              preserveAspectRatio="none"
              className="h-full"
            >
              <line 
                x1="8" 
                y1="0" 
                x2="8" 
                y2="200" 
                stroke="#9ca3af" 
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              {[...Array(12)].map((_, i) => (
                <circle
                  key={i}
                  cx="8"
                  cy={i * 16 + 8}
                  r="3"
                  fill="#fff"
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
        )}

        <div 
          className="w-48 p-4 flex flex-col justify-between"
          style={{ backgroundColor: colors.secondary }}
        >
          <div>
            <div className="text-center mb-3">
              <div 
                className="inline-block px-2 py-1 rounded text-xs font-bold mb-2"
                style={{ 
                  backgroundColor: colors.primary,
                  color: colors.text
                }}
              >
                {texts.detachableLabel}
              </div>
              <p 
                className="text-xs font-bold leading-tight"
                style={getTextStyle(colors.textSecondary)}
              >
                {clubName}
              </p>
            </div>

            <div 
              className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              {mascotImage ? (
                <img 
                  src={mascotImage} 
                  alt="M" 
                  className="w-12 h-12 object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl">🦁</span>
              )}
            </div>

            <div 
              className="text-center py-2 rounded-lg mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              <p 
                className="text-xs font-bold"
                style={getTextStyle(colors.textSecondary)}
              >
                {texts.ticketNumberLabel}
              </p>
              <p 
                className="text-2xl font-black font-mono"
                style={getTextStyle(colors.textSecondary)}
              >
                {ticketNumber}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p 
              className="text-xs font-bold"
              style={getTextStyle(colors.textSecondary)}
            >
              {texts.detachableThanks}
            </p>
            <div 
              className="mt-2 h-8 border-t-2 border-dashed"
              style={{ borderColor: colors.primary }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
        <p>Dimensões recomendadas: 210mm x 99mm (1/3 A4 horizontal)</p>
      </div>
    </div>
  );
}