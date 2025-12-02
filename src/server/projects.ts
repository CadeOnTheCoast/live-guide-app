import { db } from "@/server/db";

export function getProjectBySlug(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      primaryOwner: { select: { id: true, name: true } }
    }
  });
}
