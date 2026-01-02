"use server";

const ASANA_BASE_URL = "https://app.asana.com/api/1.0";

async function asanaFetch(endpoint: string, options: RequestInit = {}) {
    const pat = process.env.ASANA_PAT;
    if (!pat) {
        throw new Error("ASANA_PAT environment variable is not set");
    }

    const response = await fetch(`${ASANA_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${pat}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
            `Asana API error: ${response.status} ${response.statusText} - ${JSON.stringify(
                errorBody
            )}`
        );
    }

    return response.json();
}

export async function fetchAsanaTask(taskId: string) {
    const data = await asanaFetch(`/tasks/${taskId}?opt_fields=name,due_on,notes,completed`);
    return data.data;
}

export async function updateAsanaTask(taskId: string, data: { name?: string; due_on?: string | null; notes?: string }) {
    await asanaFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
    });
}
