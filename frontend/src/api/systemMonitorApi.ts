import { client } from './client';

export interface ServiceStatusItem {
    service_key: string;
    service_name: string;
    target_type: string;
    status: 'UP' | 'DEGRADED' | 'DOWN';
    latency_ms: number;
    last_checked_at: string;
    uptime_24h_percent: number;
    error_message?: string | null;
}

export interface SystemStatusSummary {
    overall_status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    checked_at: string;
    avg_latency_ms: number;
    services: ServiceStatusItem[];
    open_incidents_count: number;
    telegram_configured: boolean;
}

export interface HealthHistoryItem {
    id: string;
    service_key: string;
    service_name: string;
    status: 'UP' | 'DEGRADED' | 'DOWN';
    status_code?: number | null;
    latency_ms: number;
    error_message?: string | null;
    checked_at: string;
}

export interface AdminInviteResponse {
    email: string;
    setup_url: string;
    expires_at: string;
    message: string;
}

export interface GlobalAuditLogItem {
    _id: string;
    tenant_name?: string;
    entity: string;
    action: string;
    username: string;
    created_at: string;
}

export async function getGlobalAuditLogs(limit = 50): Promise<GlobalAuditLogItem[]> {
    return client<GlobalAuditLogItem[]>(`/audit-logs/global?limit=${limit}`);
}

export async function getSystemStatusSummary(): Promise<SystemStatusSummary> {
    return client<SystemStatusSummary>('/system-monitor/status');
}

export async function triggerInstantProbe(): Promise<{ message: string; summary: SystemStatusSummary }> {
    return client<{ message: string; summary: SystemStatusSummary }>('/system-monitor/probe-now', {
        method: 'POST',
    });
}

export async function getMonitoringHistory(limit = 50, serviceKey?: string): Promise<HealthHistoryItem[]> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (serviceKey) {
        params.set('service_key', serviceKey);
    }
    return client<HealthHistoryItem[]>(`/system-monitor/history?${params.toString()}`);
}

export async function exportSystemSnapshot(): Promise<Record<string, unknown>> {
    return client<Record<string, unknown>>('/system-monitor/export-snapshot', {
        method: 'POST',
    });
}

export async function testTelegramNotification(customMessage?: string): Promise<{ success: boolean; message: string }> {
    return client<{ success: boolean; message: string }>('/system-monitor/test-telegram', {
        method: 'POST',
        body: { custom_message: customMessage },
    });
}

export async function inviteAdminSetup(email: string): Promise<AdminInviteResponse> {
    return client<AdminInviteResponse>('/system-monitor/admin-invite', {
        method: 'POST',
        body: { email },
    });
}

export async function setupPasswordPublic(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return client<{ success: boolean; message: string }>('/system-monitor/setup-password', {
        method: 'POST',
        body: { token, password },
    });
}
