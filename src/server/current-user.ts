import { cache } from "react";
import { db } from "@/server/db";

export const getPersonByEmail = cache(async (email: string) => {
  return db.person.findUnique({ where: { email } });
});
