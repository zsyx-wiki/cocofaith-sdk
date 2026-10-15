/** 命令表的键即命令 ID；数组写法继续保留。 */
export type CommandTable<T extends { readonly id: string }> = Readonly<
  Record<string, T extends unknown ? Omit<T, "id"> & { readonly id?: never } : never>
>;

export type CommandCollection<T extends { readonly id: string }> = readonly T[] | CommandTable<T>;

export function commandEntries<T extends { readonly id: string }>(
  commands: CommandCollection<T>,
): T[] {
  if (Array.isArray(commands)) return [...commands];
  if (!commands || typeof commands !== "object") {
    throw new TypeError("命令集合必须是数组或命令表");
  }
  return Object.entries(commands).map(([id, command]) => {
    if (!command || typeof command !== "object" || Array.isArray(command)) {
      throw new TypeError(`命令 ${id} 必须是对象`);
    }
    if ("id" in command) {
      throw new TypeError(`命令 ${id} 的 ID 应由命令表的键声明`);
    }
    return { ...command, id } as T;
  });
}
