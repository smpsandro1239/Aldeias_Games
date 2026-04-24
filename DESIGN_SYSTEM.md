# 🎨 Design System - Aldeias Games

Documentação completa do Design System utilizado no projeto Aldeias Games, baseado em **Material Design 3**, **Tailwind CSS** e **shadcn/ui**.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Cores](#arquitetura-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento e Layout](#espaçamento-e-layout)
5. [Componentes UI](#componentes-ui)
6. [Animações](#animações)
7. [Temas (Light/Dark)](#temas-lightdark)
8. [Design Tokens](#design-tokens)
9. [Guias de Uso](#guias-de-uso)

---

## 🎯 Visão Geral

### Stack Tecnológico
- **Framework CSS**: Tailwind CSS v3+ com plugins de animação
- **Biblioteca de Componentes**: shadcn/ui
- **Design System**: Material Design 3
- **Tema**: Suporta Light mode e Dark mode
- **Animações**: Framer Motion + Tailwind keyframes

### Filosofia de Design
O projeto segue um **design moderno e profissional** com:
- Tema escuro por padrão (preferência de usuário respeitada)
- Paleta de cores inspirada em Material Design 3
- Componentes reutilizáveis e compostos
- Acessibilidade como prioridade
- Animações suaves e naturais

---

## 🎨 Arquitetura de Cores

### 1. Tema Escuro (Padrão)

#### Cores Primárias
| Token | Valor HSL | Cor Hex | Uso |
|-------|-----------|---------|-----|
| `--primary` | 14 90% 58% | `#ff7c4a` | CTA principal, destaques |
| `--primary-foreground` | 14 95% 12% | `#1a0d00` | Texto sobre primary |
| `--primary-container` | 14 90% 45% | `#ff5a2a` | Variações da cor primária |

#### Cores Secundárias
| Token | Valor HSL | Cor Hex | Uso |
|-------|-----------|---------|-----|
| `--secondary` | 187 100% 53% | `#00d9ff` | Acentos, destaques |
| `--secondary-foreground` | 187 100% 10% | `#001a20` | Texto sobre secondary |
| `--secondary-container` | 187 80% 20% | `#004d61` | Fundos secundários |

#### Cores Terciárias (Accent)
| Token | Valor HSL | Cor Hex | Uso |
|-------|-----------|---------|-----|
| `--tertiary` | 48 100% 55% | `#ffdd00` | Alertas, prêmios |
| `--tertiary-foreground` | 48 100% 15% | `#3d2d00` | Texto sobre tertiary |
| `--tertiary-container` | 48 80% 45% | `#ffb800` | Variações do amarelo |

#### Cores Neutras
| Token | Valor HSL | Cor Hex | Uso |
|-------|-----------|---------|-----|
| `--background` | 15 7% 5% | `#0a0705` | Fundo da página |
| `--foreground` | 20 30% 92% | `#ede5e0` | Texto principal |
| `--card` | 15 12% 9% | `#161310` | Fundos de cards |
| `--card-foreground` | 20 30% 92% | `#ede5e0` | Texto em cards |
| `--border` | 15 10% 18% | `#2d2622` | Bordas |
| `--input` | 15 10% 18% | `#2d2622` | Inputs e campos |
| `--ring` | 14 90% 58% | `#ff7c4a` | Focus rings |

#### Camadas de Surface
| Token | Valor HSL | Propósito |
|-------|-----------|----------|
| `--surface` | 15 7% 5% | Superfície base |
| `--surface-dim` | 15 7% 5% | Mínima elevação |
| `--surface-container-low` | 15 9% 7% | Baixa elevação |
| `--surface-container` | 15 10% 9% | Elevação padrão |
| `--surface-container-high` | 15 12% 11% | Alta elevação |
| `--surface-container-highest` | 15 14% 14% | Máxima elevação |

#### Estados
| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--muted` | 15 15% 12% | Elementos desativados |
| `--muted-foreground` | 20 15% 65% | Texto desativado |
| `--destructive` | 0 85% 65% | Ações destrutivas |
| `--destructive-foreground` | 0 0% 100% | Texto destrutivo |
| `--accent` | 48 100% 55% | Acentos e realces |
| `--accent-foreground` | 48 100% 15% | Texto sobre accent |

#### Outline (Bordas)
| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--outline` | 15 10% 35% | Bordas principais |
| `--outline-variant` | 15 12% 20% | Bordas secundárias |

### 2. Tema Claro (Light Mode)

O tema claro mantém a mesma estrutura mas com valores invertidos:
- **Fundo**: `#f5f0ec` (bege claro)
- **Texto**: `#0f0f0f` (preto)
- **Primária**: `#ff8866` (laranja mais vibrante)
- **Secundária**: `#2db8d4` (ciano ajustado)
- **Terciária**: `#ffb800` (amarelo)

### 3. Brand Colors (Customizados)

Cores específicas da marca Aldeias Games:
```javascript
brand: {
  bg: "#110d0c",           // Fundo muito escuro
  card: "#1f1b19",         // Card escuro
  cardAlt: "#2e2928",      // Card alternativo
  cardAlt2: "#393432",     // Card alternativo 2
  primary: "#ff734b",      // Laranja primário
  secondary: "#9cefff",    // Ciano claro
  text: "#eae0de",         // Texto principal
  textMuted: "#e0bfb7",    // Texto muted
  textLight: "#ffb5a0",    // Texto light
}
```

---

## 🔤 Tipografia

### Fontes Importadas

#### 1. **Noto Serif** (Headlines)
- **Peso**: 400, 700
- **Uso**: Títulos principais, headlines
- **Características**: Elegante, clássica, profissional
- **CSS**: `font-headline`, `font-serif`

#### 2. **Plus Jakarta Sans** (Body & Labels)
- **Peso**: 300, 400, 500, 600, 700
- **Uso**: Corpo de texto, labels, UI geral
- **Características**: Moderna, limpa, ótima legibilidade
- **CSS**: `font-body`, `font-label`

#### 3. **Chakra Petch** (Gaming/Display)
- **Peso**: 300, 400, 500, 600, 700
- **Uso**: Elementos de jogo, displays especiais
- **Características**: Futurista, impactante
- **CSS**: `font-chakra`, `font-gaming`

#### 4. **Russo One** (Brand)
- **Peso**: 400
- **Uso**: Logo, branding, títulos especiais
- **Características**: Bold, distintiva, impactante
- **CSS**: `font-gaming`

#### 5. **Inter** (Fallback)
- **Uso**: Fallback geral
- **Características**: Moderna, neutra

### Escala Tipográfica

```css
/* Tailwind Default Sizes */
text-xs    → 12px (0.75rem)    /* Labels pequenos */
text-sm    → 14px (0.875rem)   /* Descrições, legenda */
text-base  → 16px (1rem)       /* Padrão */
text-lg    → 18px (1.125rem)   /* Subtítulos */
text-xl    → 20px (1.25rem)    /* Títulos médios */
text-2xl   → 24px (1.5rem)     /* Títulos */
text-3xl   → 30px (1.875rem)   /* Headlines grandes */
text-4xl   → 36px (2.25rem)    /* Headlines principais */
text-5xl   → 48px (3rem)       /* Display */
text-6xl   → 60px (3.75rem)    /* Hero section */
text-7xl   → 84px (5.25rem)    /* Mega display */
text-8xl   → 96px (6rem)       /* Super display */
```

### Pesos Disponíveis

```
font-light     → 300
font-normal    → 400
font-medium    → 500
font-semibold  → 600
font-bold      → 700
font-black     → 900
```

### Classes Customizadas

```css
.font-headline     /* Noto Serif */
.font-body         /* Plus Jakarta Sans */
.font-label        /* Plus Jakarta Sans */
.font-serif        /* Noto Serif */
.font-gaming       /* Chakra Petch / Russo One */
```

---

## 📏 Espaçamento e Layout

### Escala de Espaçamento (Tailwind)

```
0     → 0px
1     → 0.25rem (4px)
2     → 0.5rem (8px)
3     → 0.75rem (12px)
4     → 1rem (16px)
5     → 1.25rem (20px)
6     → 1.5rem (24px)
7     → 1.75rem (28px)
8     → 2rem (32px)
9     → 2.25rem (36px)
10    → 2.5rem (40px)
11    → 2.75rem (44px)
12    → 3rem (48px)
14    → 3.5rem (56px)
16    → 4rem (64px)
20    → 5rem (80px)
```

### Border Radius

```javascript
{
  sm: "calc(var(--radius) - 4px)",     /* 0.5rem (8px) */
  md: "calc(var(--radius) - 2px)",     /* 0.625rem (10px) */
  lg: "var(--radius)",                 /* 0.75rem (12px) */
  xl: "1rem",                          /* 16px */
  "2xl": "1.5rem",                     /* 24px */
  full: "9999px",                      /* Circular */
}
```

### Box Shadows

```javascript
{
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  'glow': "0 0 20px rgba(255, 115, 75, 0.3)",          /* Glow primário */
  'glow-sm': "0 0 10px rgba(255, 115, 75, 0.2)",      /* Glow pequeno */
}
```

---

## 🧩 Componentes UI

### Componentes Disponíveis (shadcn/ui + Custom)

#### Base Components

| Componente | Arquivo | Props Principais | Variantes |
|------------|---------|-----------------|-----------|
| **Button** | `button.tsx` | `variant`, `size`, `asChild` | default, destructive, outline, secondary, ghost, link |
| **Card** | `card.tsx` | - | CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| **Input** | `input.tsx` | `type`, `placeholder`, `disabled` | - |
| **Label** | `label.tsx` | `htmlFor` | - |
| **Badge** | `badge.tsx` | `variant` | default, secondary, destructive, outline, warning |
| **Alert** | `alert.tsx` | `variant` | default, destructive |
| **Dialog** | `dialog.tsx` | - | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter |
| **Tabs** | `tabs.tsx` | `defaultValue`, `value`, `onValueChange` | - |
| **Select** | `select.tsx` | - | SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectSeparator |
| **Textarea** | `textarea.tsx` | `placeholder`, `disabled` | - |
| **Progress** | `progress.tsx` | `value`, `max` | - |
| **Switch** | `switch.tsx` | `checked`, `onCheckedChange` | - |
| **Skeleton** | `skeleton.tsx` | - | Para loading states |
| **Scroll Area** | `scroll-area.tsx` | - | ScrollArea, ScrollBar |
| **Table** | `table.tsx` | - | TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell |
| **Sonner** | `sonner.tsx` | `type`, `title`, `description` | success, error, info, warning, custom |

#### Button Variantes

```tsx
// Default (Primário)
<Button variant="default" size="default">Click me</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Variantes
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="secondary">Secondary Filled</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

#### Custom Components (Aldeias Games)

| Componente | Arquivo | Propósito |
|------------|---------|----------|
| **ThemeProvider** | `theme-provider.tsx` | Gerencia light/dark mode com next-themes |
| **AppHeader** | `app-header.tsx` | Header da aplicação |
| **BottomNav** | `bottom-nav.tsx` | Navegação mobile inferior |
| **EmptyState** | `empty-state.tsx` | Estado vazio customizado |
| **Skeleton** | `skeleton.tsx` | Loading state animado |
| **Toast** | `toast.tsx` | Notificações customizadas |
| **GameCard** | Em componentes/games | Card para exibir jogo |
| **ScratchCard** | Em componentes/games | Componente raspadinha |
| **LotteryAnimation** | `components/games/lottery-animation.tsx` | Animação de sorteio |
| **VictoryCelebration** | `components/victory-celebration.tsx` | Celebração de vitória |
| **Dashboard Stats** | `dashboard-stats.tsx` | Cards de estatísticas |
| **GameTutorial** | `game-tutorial.tsx` | Tutorial de jogos |
| **Gamification** | `gamification.tsx` | Elementos de gamificação |
| **QRCodeGenerator** | `qr-code-generator.tsx` | Gerador de QR code |

---

## ✨ Animações

### Tailwind Keyframes Built-in

```javascript
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  fade: {
    "0%": { opacity: "0", transform: "translateY(10px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
}

animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  fade: "fade 0.4s ease-out forwards",
  shimmer: "shimmer 2s infinite",
}
```

### CSS Custom Keyframes

```css
/* Float animations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-slow {
  animation: float-slow 6s ease-in-out infinite;
  animation-duration: 6s;
}

/* Fade in animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Spin animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Framer Motion (JavaScript Animations)

Usado em componentes como:
- `LotteryAnimation` - Animação de sorteio com rotação e escala
- `VictoryCelebration` - Modal de vitória com spring animations
- `GameList` - Transições de cards
- `EmptyState` - Fade in de elementos

Padrões comuns:
```tsx
// Fade in
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Scale
initial={{ scale: 0.5, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", damping: 15, stiffness: 300 }}

// Rotate
animate={{ rotate: 360 }}
transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
```

---

## 🌙 Temas (Light/Dark)

### Implementação

O projeto usa **next-themes** para gerenciar temas:

```tsx
// app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### CSS Variables por Tema

**Dark Theme (Padrão)**:
```css
:root {
  --primary: 14 90% 58%;        /* #ff7c4a */
  --secondary: 187 100% 53%;    /* #00d9ff */
  --background: 15 7% 5%;       /* #0a0705 */
  --foreground: 20 30% 92%;     /* #ede5e0 */
  /* ... mais tokens */
}
```

**Light Theme**:
```css
.light {
  --primary: 14 85% 55%;        /* #ff8866 */
  --secondary: 187 90% 45%;     /* #2db8d4 */
  --background: 30 20% 96%;     /* #f5f0ec */
  --foreground: 15 15% 10%;     /* #0f0f0f */
  /* ... mais tokens */
}
```

### Switching Themes

```tsx
import { useTheme } from "next-themes";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

---

## 🎯 Design Tokens

### Token Structure

| Categoria | Tokens | Valores |
|-----------|--------|---------|
| **Colors** | `--primary`, `--secondary`, `--tertiary`, `--accent`, etc. | HSL format |
| **Typography** | `--font-headline`, `--font-body`, `--font-label` | Font names |
| **Spacing** | Tailwind scale (0-96px) | Predefined rem values |
| **Radius** | `--radius` | 0.75rem (12px) |
| **Shadows** | `--shadow-sm`, `--shadow-lg`, `--glow` | Shadow definitions |
| **Blur** | `--glass-blur` | 24px |

### Usando Tokens

```tsx
// Em Tailwind
<div className="bg-primary text-primary-foreground rounded-lg shadow-lg">
  Content
</div>

// Em CSS custom
div {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius);
}

// Em JavaScript
const primaryColor = `hsl(var(--primary))`;
```

---

## 📖 Guias de Uso

### 1. Criando um Componente

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base styles here",
  {
    variants: {
      variant: {
        default: "...",
        secondary: "...",
      },
      size: {
        sm: "...",
        default: "...",
        lg: "...",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(componentVariants({ variant, size, className }))}
      {...props}
    />
  )
);

Component.displayName = "Component";

export { Component, componentVariants };
```

### 2. Usando Animações

```tsx
import { motion } from "framer-motion";

export function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-lg p-6"
    >
      Animated Content
    </motion.div>
  );
}
```

### 3. Customizando Cores

```tsx
// Usando cores do tema
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-secondary text-secondary-foreground">Secondary</div>
<div className="bg-accent text-accent-foreground">Accent</div>

// Usando cores brand custom
<div className="bg-[#ff734b] text-white">Brand Primary</div>
<div className="bg-[#9cefff]">Brand Secondary</div>
```

### 4. Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

### 5. Dark Mode Específico

```tsx
// Estilos diferentes por tema
<div className="bg-white dark:bg-slate-900">
  Light background in light mode, dark in dark mode
</div>

// Com variables CSS
<div className="bg-background text-foreground">
  Adapts automatically based on theme
</div>
```

---

## 🔧 Arquivo de Configuração

### tailwind.config.js

```javascript
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens aqui
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
      // ... mais customizações
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

---

## 📱 Responsividade

### Breakpoints (Tailwind default)

```
sm    →  640px
md    →  768px
lg    → 1024px
xl    → 1280px
2xl   → 1536px
```

### Padrão de Uso

```tsx
<div className="
  grid grid-cols-1         /* Mobile: 1 coluna */
  sm:grid-cols-2           /* Small: 2 colunas */
  md:grid-cols-3           /* Medium: 3 colunas */
  lg:grid-cols-4           /* Large: 4 colunas */
  gap-4
">
  {/* Items */}
</div>
```

---

## ♿ Acessibilidade

### Focus Styles
```css
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: hsl(var(--ring));
  ring-offset: 2px;
  ring-offset-color: hsl(var(--background));
}
```

### ARIA Labels

Componentes shadcn/ui incluem:
- Proper ARIA attributes
- Semantic HTML
- Keyboard navigation support
- Screen reader support

---

## 📚 Referências de Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `tailwind.config.js` | Configuração do Tailwind |
| `src/app/globals.css` | CSS global e variáveis de tema |
| `src/components/ui/` | Componentes shadcn/ui base |
| `src/components/theme-provider.tsx` | Provider de temas |
| `src/components/` | Componentes customizados |

---

## 🎓 Boas Práticas

1. **Use Design Tokens**: Sempre use as variáveis CSS do tema em vez de cores hardcoded
2. **Componentes Compostos**: Reutilize componentes shadcn/ui e crie variações
3. **Responsividade First**: Comece mobile e escale para desktop
4. **Acessibilidade**: Inclua labels, ARIA attributes e suporte a keyboard
5. **Animações Moderadas**: Use animações para orientar UX, não distrair
6. **Tema Adaptativo**: Teste ambos light/dark modes
7. **Performance**: Use `transition-colors` em vez de animar background colors

---

**Última atualização**: Abril 2026
**Autor**: Aldeias Games Design Team
