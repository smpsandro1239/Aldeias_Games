# 📦 Componentes UI - Exemplos e Variantes

Guia prático com exemplos de código para todos os componentes shadcn/ui disponíveis no projeto.

---

## 📑 Índice de Componentes

1. [Button](#button)
2. [Card](#card)
3. [Input](#input)
4. [Label](#label)
5. [Badge](#badge)
6. [Alert](#alert)
7. [Dialog](#dialog)
8. [Tabs](#tabs)
9. [Select](#select)
10. [Textarea](#textarea)
11. [Progress](#progress)
12. [Switch](#switch)
13. [Skeleton](#skeleton)
14. [Scroll Area](#scroll-area)
15. [Table](#table)
16. [Toast/Sonner](#toast)
17. [Custom Components](#custom-components)

---

## Button

### Arquivo
`src/components/ui/button.tsx`

### Variantes
- `default` - Primário (laranja)
- `destructive` - Vermelho
- `outline` - Outline com border
- `secondary` - Secundário (ciano)
- `ghost` - Transparente
- `link` - Link style

### Tamanhos
- `sm` - Pequeno (h-8, text-xs)
- `default` - Padrão (h-9, text-sm)
- `lg` - Grande (h-10, text-sm)
- `icon` - Ícone quadrado (h-9, w-9)

### Exemplos

```tsx
import { Button } from "@/components/ui/button";

// Default
<Button>Click me</Button>

// Variantes
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>

// Combinações
<Button variant="secondary" size="lg">Large Secondary</Button>

// Desativado
<Button disabled>Disabled</Button>

// Loading state (custom)
<Button disabled>
  <Loader className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Com ícone
<Button>
  <Icon className="mr-2 h-4 w-4" />
  With Icon
</Button>
```

---

## Card

### Arquivo
`src/components/ui/card.tsx`

### Subcomponentes
- `Card` - Container principal
- `CardHeader` - Cabeçalho
- `CardTitle` - Título
- `CardDescription` - Descrição
- `CardContent` - Conteúdo
- `CardFooter` - Rodapé

### Exemplo Completo

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  );
}
```

### Variações

```tsx
// Card mínimo
<Card>
  <CardContent className="pt-6">
    Simple content
  </CardContent>
</Card>

// Card com stats
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Total Users
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">1,234</div>
    <p className="text-xs text-muted-foreground">+12% from last month</p>
  </CardContent>
</Card>

// Card com múltiplas ações
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Settings form */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

## Input

### Arquivo
`src/components/ui/input.tsx`

### Props Principais
- `type` - Input type (text, email, password, number, etc)
- `placeholder` - Placeholder text
- `disabled` - Desabilitado
- `readonly` - Read-only
- `value` / `onChange` - Controlled input

### Exemplos

```tsx
import { Input } from "@/components/ui/input";

// Básico
<Input placeholder="Enter text..." />

// Tipos
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Amount" />
<Input type="date" />
<Input type="search" placeholder="Search..." />

// Estados
<Input disabled placeholder="Disabled..." />
<Input readonly value="Read-only..." />

// Com label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>

// Customizado com className
<Input
  placeholder="Search games..."
  className="bg-surface-container border-outline"
/>
```

---

## Label

### Arquivo
`src/components/ui/label.tsx`

### Props Principais
- `htmlFor` - ID do input associado
- `className` - Classes customizadas

### Exemplos

```tsx
import { Label } from "@/components/ui/label";

// Com input
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" />
</div>

// Com checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to terms</Label>
</div>

// Com radio
<div className="flex items-center space-x-2">
  <RadioGroupItem value="option1" id="option1" />
  <Label htmlFor="option1">Option 1</Label>
</div>

// Customizado
<Label className="text-sm font-medium text-primary">
  Required Field
</Label>
```

---

## Badge

### Arquivo
`src/components/ui/badge.tsx`

### Variantes
- `default` - Primário
- `secondary` - Secundário
- `destructive` - Vermelho
- `outline` - Outline
- `warning` - Amarelo

### Exemplos

```tsx
import { Badge } from "@/components/ui/badge";

// Variantes
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="warning">Warning</Badge>

// Em listas
<div className="flex gap-2">
  <Badge>React</Badge>
  <Badge variant="secondary">TypeScript</Badge>
  <Badge variant="outline">Tailwind</Badge>
</div>

// Com ícone
<Badge>
  <Check className="w-3 h-3 mr-1" />
  Completed
</Badge>

// Estados de jogo
<Badge variant="secondary">Raspadinha</Badge>
<Badge variant="outline">Poio da Vaca</Badge>
<Badge variant="warning">Premium</Badge>
```

---

## Alert

### Arquivo
`src/components/ui/alert.tsx`

### Subcomponentes
- `Alert` - Container
- `AlertTitle` - Título
- `AlertDescription` - Descrição

### Variantes
- `default` - Info/neutro
- `destructive` - Erro/alerta

### Exemplos

```tsx
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

// Info
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>This is an informational alert</AlertDescription>
</Alert>

// Sucesso
<Alert variant="default">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your action was successful</AlertDescription>
</Alert>

// Erro
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>

// Aviso
<Alert>
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Please review before proceeding</AlertDescription>
</Alert>
```

---

## Dialog

### Arquivo
`src/components/ui/dialog.tsx`

### Subcomponentes
- `Dialog` - Root
- `DialogTrigger` - Button trigger
- `DialogContent` - Modal content
- `DialogHeader` - Header
- `DialogTitle` - Title
- `DialogDescription` - Description
- `DialogFooter` - Footer
- `DialogClose` - Close button

### Exemplos

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Básico
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div className="py-4">Content here</div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Com estado controlado
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    {/* ... */}
  </DialogContent>
</Dialog>

// Formulário
<Dialog>
  <DialogTrigger asChild>
    <Button>Add Item</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Item</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Tabs

### Arquivo
`src/components/ui/tabs.tsx`

### Subcomponentes
- `Tabs` - Container
- `TabsList` - Lista de tabs
- `TabsTrigger` - Botão tab
- `TabsContent` - Conteúdo

### Exemplos

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Básico
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
  <TabsContent value="tab3">Content 3</TabsContent>
</Tabs>

// Controlado
const [value, setValue] = useState("overview");

<Tabs value={value} onValueChange={setValue}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">{/* ... */}</TabsContent>
  <TabsContent value="analytics">{/* ... */}</TabsContent>
  <TabsContent value="settings">{/* ... */}</TabsContent>
</Tabs>

// Com ícones
<Tabs defaultValue="games">
  <TabsList>
    <TabsTrigger value="games" className="flex gap-2">
      <Gamepad2 className="w-4 h-4" />
      Jogos
    </TabsTrigger>
    <TabsTrigger value="premos" className="flex gap-2">
      <Trophy className="w-4 h-4" />
      Prêmios
    </TabsTrigger>
  </TabsList>
  <TabsContent value="games">{/* Games */}</TabsContent>
  <TabsContent value="premos">{/* Prizes */}</TabsContent>
</Tabs>
```

---

## Select

### Arquivo
`src/components/ui/select.tsx`

### Subcomponentes
- `Select` - Root
- `SelectGroup` - Grupo de opções
- `SelectValue` - Valor selecionado
- `SelectTrigger` - Button trigger
- `SelectContent` - Dropdown
- `SelectItem` - Opção
- `SelectSeparator` - Separador

### Exemplos

```tsx
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "@/components/ui/select";

// Básico
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// Com grupos
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Vegetables</SelectLabel>
      <SelectItem value="carrot">Carrot</SelectItem>
      <SelectItem value="lettuce">Lettuce</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// Controlado
const [value, setValue] = useState("");

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="val1">Value 1</SelectItem>
    <SelectItem value="val2">Value 2</SelectItem>
  </SelectContent>
</Select>

// Para jogos
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione um jogo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="raspadinha">Raspadinha</SelectItem>
    <SelectItem value="poio">Poio da Vaca</SelectItem>
    <SelectItem value="roulette">Roleta</SelectItem>
  </SelectContent>
</Select>
```

---

## Textarea

### Arquivo
`src/components/ui/textarea.tsx`

### Props Principais
- `placeholder` - Placeholder text
- `rows` - Número de linhas
- `disabled` - Desabilitado
- `value` / `onChange` - Controlled

### Exemplos

```tsx
import { Textarea } from "@/components/ui/textarea";

// Básico
<Textarea placeholder="Enter your message..." />

// Com linhas
<Textarea placeholder="Enter text..." rows={5} />

// Desabilitado
<Textarea disabled placeholder="Disabled..." />

// Com label
<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea id="message" placeholder="Your message..." />
</div>

// Controlado
const [text, setText] = useState("");

<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder="Type here..."
/>
```

---

## Progress

### Arquivo
`src/components/ui/progress.tsx`

### Props Principais
- `value` - Porcentagem (0-100)
- `max` - Valor máximo (default 100)

### Exemplos

```tsx
import { Progress } from "@/components/ui/progress";

// Básico
<Progress value={65} />

// 0%
<Progress value={0} />

// 100%
<Progress value={100} />

// Customizado
<Progress value={75} className="h-2" />

// Com label
<div className="space-y-2">
  <div className="flex justify-between">
    <span>Loading...</span>
    <span>75%</span>
  </div>
  <Progress value={75} />
</div>

// Animado
const [progress, setProgress] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
  }, 500);
  return () => clearInterval(timer);
}, []);

<Progress value={progress} />
```

---

## Switch

### Arquivo
`src/components/ui/switch.tsx`

### Props Principais
- `checked` - Estado
- `onCheckedChange` - Callback
- `disabled` - Desabilitado
- `id` - Para associar com label

### Exemplos

```tsx
import { Switch } from "@/components/ui/switch";

// Básico
<Switch />

// Controlado
const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onCheckedChange={setEnabled} />

// Com label
<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Notifications</Label>
</div>

// Desabilitado
<Switch disabled />

// Configurações
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label>Dark Mode</Label>
    <Switch checked={isDark} onCheckedChange={setIsDark} />
  </div>
  <div className="flex items-center justify-between">
    <Label>Notifications</Label>
    <Switch />
  </div>
  <div className="flex items-center justify-between">
    <Label>Sound</Label>
    <Switch defaultChecked />
  </div>
</div>
```

---

## Skeleton

### Arquivo
`src/components/ui/skeleton.tsx`

### Uso
Loading placeholder

### Exemplos

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Card loading
<div className="space-y-2">
  <Skeleton className="h-12 w-12 rounded-full" />
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>

// Lista loading
<div className="space-y-2">
  {[...Array(3)].map((_, i) => (
    <Skeleton key={i} className="h-12 w-full" />
  ))}
</div>

// Grid loading
<div className="grid grid-cols-3 gap-4">
  {[...Array(6)].map((_, i) => (
    <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
  ))}
</div>

// Com conditional rendering
{loading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Card>{/* ... */}</Card>
)}
```

---

## Scroll Area

### Arquivo
`src/components/ui/scroll-area.tsx`

### Subcomponentes
- `ScrollArea` - Container
- `ScrollBar` - Scrollbar

### Exemplos

```tsx
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Scroll vertical
<ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  <div className="space-y-4">
    {items.map((item) => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
</ScrollArea>

// Scroll horizontal
<ScrollArea className="w-96 whitespace-nowrap rounded-md border">
  <div className="flex w-max space-x-4 p-4">
    {items.map((item) => (
      <div key={item.id} className="flex-shrink-0 w-[200px]">
        {item.name}
      </div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>

// Ocultar scrollbar
<div className="hide-scrollbar h-[300px] overflow-y-auto">
  {/* Content */}
</div>
```

---

## Table

### Arquivo
`src/components/ui/table.tsx`

### Subcomponentes
- `Table` - Root
- `TableHeader` / `TableBody` / `TableFooter` - Seções
- `TableRow` - Linha
- `TableHead` / `TableCell` - Células

### Exemplo Completo

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const data = [
  { id: 1, name: "John", amount: 100 },
  { id: 2, name: "Jane", amount: 200 },
];

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>${item.amount}</TableCell>
        <TableCell>
          <Button size="sm" variant="outline">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell>Total</TableCell>
      <TableCell>${data.reduce((a, b) => a + b.amount, 0)}</TableCell>
      <TableCell></TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

---

## Toast/Sonner

### Arquivo
`src/components/ui/sonner.tsx` + `src/components/toast.tsx`

### Tipos
- `success` - Verde
- `error` - Vermelho
- `warning` - Amarelo
- `info` - Azul

### Exemplo com Sonner

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Operation successful!");

// Erro
toast.error("An error occurred");

// Info
toast.info("This is informational");

// Warning
toast.warning("Please be careful");

// Customizado
toast.custom((t) => (
  <div className="bg-card rounded-lg p-4">
    Custom toast
  </div>
));

// Promise toast
toast.promise(
  new Promise((resolve) => {
    setTimeout(() => resolve("Done!"), 2000);
  }),
  {
    loading: "Loading...",
    success: "Success!",
    error: "Error!",
  }
);
```

---

## Custom Components

### EmptyState

```tsx
import { EmptyState } from "@/components/empty-state";

<EmptyState
  icon={Inbox}
  title="No games yet"
  description="Start playing to see your games here"
  action={{
    label: "Play Now",
    onClick: () => navigate("/jogos"),
  }}
  variant="default"
/>
```

### GameCard

Ver em `src/components/games/`

### Skeleton Loading

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {[...Array(6)].map((_, i) => (
    <Skeleton key={i} className="h-[250px]" />
  ))}
</div>
```

### LotteryAnimation

```tsx
import { LotteryAnimation } from "@/components/games/lottery-animation";

<LotteryAnimation
  finalResult={42}
  isSpinning={isSpinning}
  onFinish={handleFinish}
  type="number"
/>
```

### VictoryCelebration

```tsx
import { VictoryCelebration } from "@/components/victory-celebration";

<VictoryCelebration
  open={showCelebration}
  onOpenChange={setShowCelebration}
  premio={1000}
  jogoNome="Raspadinha"
  tipoJogo="raspadinha"
  onShare={handleShare}
/>
```

---

## 🎨 Padrões de Composição

### Form Pattern

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Enter email" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" placeholder="Enter password" />
  </div>
  <div className="flex items-center gap-2">
    <Checkbox id="terms" />
    <Label htmlFor="terms">I agree to terms</Label>
  </div>
  <Button type="submit" className="w-full">Sign In</Button>
</form>
```

### Card Grid

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>{item.content}</CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

### Modal Pattern

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Modal Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

**Última atualização**: Abril 2026
