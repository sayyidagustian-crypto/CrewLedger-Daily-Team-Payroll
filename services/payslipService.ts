
import type { Employee, DailyGroupLog, Payslip, PayslipLogEntry } from '../types';

class PayslipService {
    /**
     * Generates a payslip for a single employee for a given period.
     */
    public generatePayslip(
        employee: Employee,
        periodYYYYMM: string,
        dailyLogs: DailyGroupLog[],
        allowance: number,
        deduction: number
    ): Payslip {
        const [year, month] = periodYYYYMM.split('-').map(Number);
        const periodMonth = month - 1;
        const periodYear = year;
        const displayPeriod = new Date(periodYYYYMM + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

        const relevantLogs = dailyLogs.filter(log => {
            const logDate = new Date(log.date);
            return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
        });

        const payslipLogs: PayslipLogEntry[] = relevantLogs.flatMap(dayLog => {
            return dayLog.tasks.map(task => ({
                date: dayLog.date,
                taskName: task.taskName,
                totalDailyGross: task.subTotal,
                workersPresent: dayLog.presentEmployeeIds.length,
                yourEarning: dayLog.individualEarnings
            }));
        });
        
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
            deduction,
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
            const relevantLogs = dailyLogs.filter(log => {
                const logDate = new Date(log.date);
                return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
            });
    
            const grossSalary = relevantLogs.reduce((total, log) => total + log.individualEarnings, 0);
    
            if (grossSalary > 0) {
                 const payslipLogs: PayslipLogEntry[] = relevantLogs.flatMap(dayLog => {
                    return dayLog.tasks.map(task => ({
                        date: dayLog.date,
                        taskName: task.taskName,
                        totalDailyGross: task.subTotal,
                        workersPresent: dayLog.presentEmployeeIds.length,
                        yourEarning: dayLog.individualEarnings
                    }));
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
