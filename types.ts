export enum LeaveType {
    ANNUAL = 'ANNUAL',
    COMPENSATORY = 'COMPENSATORY',
    SICK = 'SICK',
    PERSONAL = 'PERSONAL'
}

export enum RequestCategory {
    LEAVE = 'LEAVE',
    OVERTIME = 'OVERTIME',
    OVERTIME_VERIFY = 'OVERTIME_VERIFY',
    OFFICIAL_OUTING = 'OFFICIAL_OUTING',
    PUNCH_CORRECTION = 'PUNCH_CORRECTION'
}

export enum RequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export type ShiftType = 'A' | 'B' | 'C';

export interface ShiftDefinition {
    type: ShiftType;
    startTime: string; 
  endTime: string;   
  lunchStart: string; 
  lunchEnd: string;   
}

export const SHIFTS: Record<ShiftType, ShiftDefinition> = {
    A: { type: 'A', startTime: '08:30', endTime: '17:30', lunchStart: '12:00', lunchEnd: '13:00' },
    B: { type: 'B', startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    C: { type: 'C', startTime: '09:30', endTime: '18:30', lunchStart: '12:00', lunchEnd: '13:00' },
};

export interface Company {
    id: string;
    name: string;
    schema: string;
    isListed: boolean; 
  punchLimit: number;
}

export interface User {
    id: string;
    employeeId: string;
    tenantId: string;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'HR';
    department: string;
    hireDate: string;
    seniority: number; 
  shift: ShiftType;
}

export interface WorkflowPolicy {
    deptId: string;
    deptName: string;
    approvalTiers: number;
    forceEmailNotify: boolean;
    approverId: string;
}

export interface AuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    resource: string;
    ip: string;
    details: string;
    oldValue?: string;
    newValue?: string;
}

export interface WorkCalendarEntry {
    date: string;
    isWorkingDay: boolean;
    description: string;
}

export interface ConsumptionItem {
    sourceId: string;
    sourceName: string;
    hours: number;
    expiryDate: string;
}
