export type Role = {
  id: string;
  name: string;
};

export type Aldeia = {
  id: string;
  nome: string;
};

export type UserGlobalRole = {
  roleId: string;
  role: Role;
};

export type UserAldeiaRole = {
  roleId: string;
  aldeiaId: string;
  role: Role;
  aldeia: Aldeia | null;
};

export type User = {
  id: string;
  nome: string;
  email: string;
  userGlobalRoles: UserGlobalRole[];
  userAldeiaRoles: UserAldeiaRole[];
};

export type SortField = "nome" | "email" | "globalRolesCount" | "aldeiaRolesCount";
export type SortDirection = "asc" | "desc";

export const PAGE_SIZES = [20, 50, 100];

export function filterUsers(
  users: User[],
  filters: { search: string; aldeia: string; role: string; hasRole: string },
  sortField: SortField,
  sortDirection: SortDirection
): User[] {
  const { search, aldeia, role, hasRole } = filters;
  const normalizedSearch = search.trim().toLowerCase();
  let result = users;

  if (normalizedSearch) {
    result = result.filter((user) => {
      const fields = [
        user.nome,
        user.email,
        user.id,
        user.userGlobalRoles.map((r) => r.role?.name).join(" "),
        user.userAldeiaRoles
          .map((r) => `${r.role?.name} ${r.aldeia?.nome ?? ""}`)
          .join(" "),
      ].join(" ").toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }

  if (aldeia !== "all") {
    result = result.filter((user) =>
      user.userAldeiaRoles.some((r) => r.aldeiaId === aldeia)
    );
  }

  if (role !== "all") {
    result = result.filter(
      (user) =>
        user.userGlobalRoles.some((r) => r.roleId === role) ||
        user.userAldeiaRoles.some((r) => r.roleId === role)
    );
  }

  if (hasRole === "with") {
    result = result.filter(
      (user) =>
        user.userGlobalRoles.length > 0 || user.userAldeiaRoles.length > 0
    );
  } else if (hasRole === "without") {
    result = result.filter(
      (user) =>
        user.userGlobalRoles.length === 0 && user.userAldeiaRoles.length === 0
    );
  }

  result = [...result].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "nome":
        comparison = a.nome.localeCompare(b.nome);
        break;
      case "email":
        comparison = a.email.localeCompare(b.email);
        break;
      case "globalRolesCount":
        comparison = a.userGlobalRoles.length - b.userGlobalRoles.length;
        break;
      case "aldeiaRolesCount":
        comparison = a.userAldeiaRoles.length - b.userAldeiaRoles.length;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return result;
}