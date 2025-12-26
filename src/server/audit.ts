import { db } from "@/server/db";

interface LogAuditParams {
    actorEmail: string;
    actorUserId?: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
}

function sanitizeForAudit(obj: unknown) {
    if (!obj || typeof obj !== 'object') return undefined;

    // Deep copy to avoid mutating original
    const copy = JSON.parse(JSON.stringify(obj));

    // Remove common relations/large fields if they exist
    // This is a simple safeguard to prevent logging huge nested objects
    const sensitiveKeys = ["password", "token", "secret", "cvv"];

    const clean = (item: Record<string, unknown>) => {
        if (!item || typeof item !== 'object') return;

        for (const key in item) {
            // Remove relations (Prisma objects usually have lowercase keys for relations,
            // but we'll check if they are objects/arrays that aren't Date/JSON)
            const value = item[key];
            if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
                // If it's a relation (not a primary JSON field or Date), remove it
                // In this app, most relations are included in findUnique, so we drop them
                delete item[key];
            } else if (sensitiveKeys.includes(key.toLowerCase())) {
                item[key] = "[REDACTED]";
            }
        }
    };

    clean(copy);
    return copy;
}

/**
 * Logs an administrative action to the AuditLog table.
 */
export async function logAudit({
    actorEmail,
    actorUserId,
    action,
    entityType,
    entityId,
    before,
    after,
}: LogAuditParams) {
    try {
        await db.auditLog.create({
            data: {
                actorEmail,
                actorUserId,
                action,
                entityType,
                entityId,
                before: sanitizeForAudit(before),
                after: sanitizeForAudit(after),
            },
        });
    } catch (error) {
        // We don't want to crash the main action if logging fails, but we should log it
        console.error("Failed to write audit log:", error);
    }
}
