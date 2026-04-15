// Setup para testes Jest
require("@testing-library/jest-dom");

// Definir variáveis de ambiente necessárias para os testes
process.env.JWT_SECRET = "test-jest-secret-for-testing-only";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-for-testing-only";

// Global globals que faltam no ambiente jsdom
global.TextEncoder = require("util").TextEncoder || function() {};
global.TextDecoder = require("util").TextDecoder || function() {};

// Mock do localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock do fetch
global.fetch = jest.fn();

// Mock do matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock do next/headers (usado em auth.ts)
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: () => ({ value: "mock-token" }),
    set: () => {},
    delete: () => {},
  }),
}));

// Mock do next/server
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body, init) => ({
      json: () => Promise.resolve(body),
      ...init,
    }),
  },
}));

// Mock do prisma (já que usamos um mock nos testes de unidade)
jest.mock("./src/lib/db", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    evento: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jogo: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    aldeia: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    participacao: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

// Melhoramento do mock do jose baseado na sugestão
let storedPayload = null;

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation((payload) => {
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockImplementation(async () => {
        // Armazenar o payload para uso no jwtVerify
        storedPayload = payload;
        
        // Criar um token JWT falso com 3 partes
        // Header fixo para HS256
        const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const headerB64 = header.toString('base64')
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
        
        // Payload codificado
        const payloadBuf = Buffer.from(JSON.stringify(payload));
        const payloadB64 = payloadBuf.toString('base64')
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
        
        // Assinatura falsa
        const signature = "fakeSignature";
        
        return `${headerB64}.${payloadB64}.${signature}`;
      }),
    };
  }),
  
  jwtVerify: jest.fn().mockImplementation(async (token) => {
    if (token === "invalid-token") {
      throw new Error("Invalid token");
    }
    
    // Devolver o payload que foi armazenado na última chamada ao SignJWT
    // Se não houver payload armazenado (caso de teste direto do verifyToken), devolver um padrão
    return {
      protectedHeader: { alg: "HS256" },
      payload: storedPayload || {
        userId: "test-user-id",
        email: "test@example.com",
        role: "super_admin",
      },
    };
  }),
  
  // Função para limpar o estado entre testes
  __reset: () => {
    storedPayload = null;
  }
}));

// Antes de cada teste, limpar o estado do mock jose
const originalBeforeEach = global.beforeEach;
global.beforeEach = function(fn) {
  return originalBeforeEach.call(this, () => {
    const jestSetup = require('./jest.setup.js');
    if (jestSetup && jestSetup.jose && jestSetup.jose.__reset) {
      jestSetup.jose.__reset();
    }
    return fn.call(this);
  });
};