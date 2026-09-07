export class SLAService {
  public static getTargetHours(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 24;
      case 'high':
        return 48;
      case 'medium':
        return 120; // 5 days
      case 'low':
      default:
        return 240; // 10 days
    }
  }

  public static calculateDueDate(createdAt: Date, severity: string): Date {
    const hours = this.getTargetHours(severity);
    return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  }

  public static evaluateOverdueStatus(createdAt: Date, slaDueAt: Date, status: string): { isOverdue: boolean; overdueHours: number } {
    if (status === 'RESOLVED') {
      return { isOverdue: false, overdueHours: 0 };
    }

    const now = new Date();
    if (now > slaDueAt) {
      const diffMs = now.getTime() - slaDueAt.getTime();
      const overdueHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return { isOverdue: true, overdueHours };
    }

    return { isOverdue: false, overdueHours: 0 };
  }
}
