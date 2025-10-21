import type { Employee, DailyGroupLog, Payslip, PayslipLogEntry } from '../types';

class PayslipService {
    /**
     * Recalculates earnings for a daily log to ensure customTasks are included.
     * This is crucial for handling data saved before the freelance/customTasks feature was added.
     * It returns a new log object, leaving the original untouched.
     */
    private _recalculateLog(log: DailyGroupLog): DailyGroupLog {
        const standardTasksTotal = log.tasks.reduce((sum, task) => sum + task.subTotal, 0);
        const customTasksTotal = (log.customTasks || []).reduce((sum, task) => sum + task.totalEarning, 0);
        
        const totalGrossEarnings = standardTasksTotal + customTasksTotal;
        const individualEarnings = log.presentEmployeeIds.length > 0 ? totalGrossEarnings / log.presentEmployeeIds.length : 0;
        
        // Return a new object to avoid mutating the state directly
        return {
            ...log,
            totalGrossEarnings,
            individualEarnings,
        };
    }

    /**
     * Generates a payslip for a single employee for a given period.
     */
    public generatePayslip(
        employee: Employee,
        periodYYYYMM: string,
        dailyLogs: DailyGroupLog[],
        allowance: number,
        deduction: number,
        previousLogIds: string[] = [],
        allowanceDescription?: string,
        deductionDescription?: string
    ): Payslip {
        const [year, month] = periodYYYYMM.split('-').map(Number);
        const periodMonth = month - 1;
        const periodYear = year;
        const displayPeriod = new Date(periodYYYYMM + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

        const currentPeriodLogs = dailyLogs
            .filter(log => {
                const logDate = new Date(log.date);
                return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
            });
        
        const previousPeriodLogs = dailyLogs
            .filter(log => previousLogIds.includes(log.id) && log.presentEmployeeIds.includes(employee.id));

        const relevantLogs = [...previousPeriodLogs, ...currentPeriodLogs]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            // IMPORTANT: Recalculate each log to fix old data structures.
            .map(log => this._recalculateLog(log));

        const payslipLogs: PayslipLogEntry[] = relevantLogs.map(dayLog => {
            const standardTaskNames = dayLog.tasks.map(t => t.taskName);
            const customTaskNames = dayLog.customTasks?.map(t => t.name) || [];
            const allTaskNames = [...standardTaskNames, ...customTaskNames];

            return {
                date: dayLog.date,
                taskName: allTaskNames.join(', ') || '-',
                // Use the recalculated values
                totalDailyGross: dayLog.totalGrossEarnings,
                workersPresent: dayLog.presentEmployeeIds.length,
                yourEarning: dayLog.individualEarnings
            };
        });
        
        // Use the recalculated individualEarnings for the sum
        const grossSalary = relevantLogs.reduce((total, log) => total + log.individualEarnings, 0);
        const netSalary = grossSalary + allowance - deduction;

        const payslip: Payslip = {
            id: Date.now().toString(),
            employeeId: employee.id,
            employeeName: employee.name,
            employeePosition: employee.position,
            employeeProfilePicture: employee.profilePicture,
            period: displayPeriod,
            logs: payslipLogs,
            grossSalary,
            allowance,
            allowanceDescription,
            deduction,
            deductionDescription,
            netSalary,
            createdAt: new Date().toISOString(),
        };

        return payslip;
    }

    /**
     * Generates payslips in bulk for all active employees who had earnings in a given period.
     */
    public bulkGeneratePayslips(
        periodYYYYMM: string,
        activeEmployees: Employee[],
        dailyLogs: DailyGroupLog[],
    ): Payslip[] {
        const newPayslips: Payslip[] = [];
        const displayPeriod = new Date(periodYYYYMM + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
        const periodMonth = new Date(periodYYYYMM + '-02').getUTCMonth();
        const periodYear = new Date(periodYYYYMM + '-02').getUTCFullYear();
    
        activeEmployees.forEach(employee => {
            const relevantLogs = dailyLogs
                .filter(log => {
                    const logDate = new Date(log.date);
                    return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
                })
                // IMPORTANT: Recalculate each log to fix old data structures.
                .map(log => this._recalculateLog(log));
    
            // Use the recalculated individualEarnings for the sum
            const grossSalary = relevantLogs.reduce((total, log) => total + log.individualEarnings, 0);
    
            if (grossSalary > 0) {
                 const payslipLogs: PayslipLogEntry[] = relevantLogs.map(dayLog => {
                    const standardTaskNames = dayLog.tasks.map(t => t.taskName);
                    const customTaskNames = dayLog.customTasks?.map(t => t.name) || [];
                    const allTaskNames = [...standardTaskNames, ...customTaskNames];
                    
                    return {
                        date: dayLog.date,
                        taskName: allTaskNames.join(', ') || '-',
                        // Use the recalculated values
                        totalDailyGross: dayLog.totalGrossEarnings,
                        workersPresent: dayLog.presentEmployeeIds.length,
                        yourEarning: dayLog.individualEarnings
                    };
                });

                const payslip: Payslip = {
                    id: `${Date.now().toString()}-${employee.id}`,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    employeePosition: employee.position,
                    employeeProfilePicture: employee.profilePicture,
                    period: displayPeriod,
                    logs: payslipLogs,
                    grossSalary,
                    allowance: 0, // Default allowance/deduction to 0 for bulk generation
                    deduction: 0,
                    netSalary: grossSalary,
                    createdAt: new Date().toISOString(),
                };
                newPayslips.push(payslip);
            }
        });
        return newPayslips;
    }
}

// Export a singleton instance for global use.
export const payslipService = new PayslipService();