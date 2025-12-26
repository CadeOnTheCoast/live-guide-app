import { db } from "@/server/db";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminAuditPage() {
    const logs = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Audit Log</h1>
                <p className="text-muted-foreground">Recent administrative actions</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs">{log.actorEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${log.action === "CREATE" ? "bg-green-100 text-green-800" :
                                                log.action === "UPDATE" ? "bg-blue-100 text-blue-800" :
                                                    "bg-red-100 text-red-800"
                                            }`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.entityType}</span>
                                            <span className="text-xs text-muted-foreground">{log.entityId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <pre className="max-h-24 max-w-xs overflow-auto text-xs">
                                            {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                                        </pre>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
