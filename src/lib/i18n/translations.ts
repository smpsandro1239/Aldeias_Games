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
export type TranslationKey = keyof typeof translations.pt;

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
