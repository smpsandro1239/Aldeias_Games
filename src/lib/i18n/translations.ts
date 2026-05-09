export const translations = {
  pt: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Criar",
      search: "Pesquisar",
      loading: "A carregar...",
      error: "Erro",
      success: "Sucesso",
    },
    nav: {
      home: "Início",
      admin: "Admin",
      profile: "Perfil",
      logout: "Sair",
    },
    auth: {
      login: "Entrar",
      register: "Registar",
      password: "Password",
      email: "Email",
      forgotPassword: "Esqueci a password",
      resetPassword: "Recuperar Password",
    },
    dashboard: {
      overview: "Visão Geral",
      eventos: "Eventos",
      jogos: "Jogos",
      users: "Utilizadores",
      vendas: "Vendas",
    },
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    },
    nav: {
      home: "Home",
      admin: "Admin",
      profile: "Profile",
      logout: "Logout",
    },
    auth: {
      login: "Login",
      register: "Register",
      password: "Password",
      email: "Email",
      forgotPassword: "Forgot password",
      resetPassword: "Reset Password",
    },
    dashboard: {
      overview: "Overview",
      eventos: "Events",
      jogos: "Games",
      users: "Users",
      vendas: "Sales",
    },
  },
  es: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      search: "Buscar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
    },
    nav: {
      home: "Inicio",
      admin: "Admin",
      profile: "Perfil",
      logout: "Salir",
    },
    auth: {
      login: "Entrar",
      register: "Registrarse",
      password: "Contraseña",
      email: "Email",
      forgotPassword: "Olvidé mi contraseña",
      resetPassword: "Recuperar Contraseña",
    },
    dashboard: {
      overview: "Resumen",
      eventos: "Eventos",
      jogos: "Juegos",
      users: "Usuarios",
      vendas: "Ventas",
    },
  },
};

export type Language = keyof typeof translations;

// Type-safe translation keys
type TranslationPaths<T> = T extends (string | number | boolean)
  ? []
  : T extends Record<string, any>
  ? {
      [K in keyof T]: [K, ...TranslationPaths<T[K]>];
    }[keyof T]
  : [];

// Simplified translation key type
export type TranslationKey = string;

export function getTranslation(lang: Language, key: string): string {
  if (!key || typeof key !== 'string') {
    return key;
  }

  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  return typeof value === 'string' ? value : key;
}
