
import React, { useRef, useState } from 'react';
import type { Payslip } from '../types';
import { DownloadIcon, ShareIcon, UserCircleIcon } from './icons';
import { useI18n } from '../i18n';

// Global window object might not have these properties, so we declare them.
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

export const PayslipPreview: React.FC<{ payslip: Payslip | null }> = ({ payslip }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { t, formatCurrency, formatDate } = useI18n();

  const handleExportPDF = () => {
    if (!payslipRef.current || !payslip) return;
    
    const { jsPDF } = window.jspdf;
    const html2canvas = window.html2canvas;

    html2canvas(payslipRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`payslip-${payslip.employeeName.replace(/\s/g, '-')}-${payslip.period}.pdf`);
    });
  };

  const handleShare = async () => {
    if (!payslipRef.current || !payslip) return;
    if (!navigator.share) {
        alert(t('shareNotSupported'));
        return;
    }

    setIsSharing(true);

    try {
        const canvas = await window.html2canvas(payslipRef.current, { scale: 2 });
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], `payslip-${payslip.employeeName.replace(/\s/g, '-')}-${payslip.period}.png`, { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: `Payslip for ${payslip.employeeName}`,
                    text: `Here is the payslip for ${payslip.employeeName} for the period ${payslip.period}.`,
                };
                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    // Fallback for browsers that don't support file sharing
                    await navigator.share({
                        title: shareData.title,
                        text: shareData.text,
                    });
                }
            }
             setIsSharing(false);
        }, 'image/png');
    } catch (error) {
        console.error('Error sharing:', error);
        if ((error as Error).name !== 'AbortError') {
          alert(t('shareError'));
        }
        setIsSharing(false);
    }
  };


  if (!payslip) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
        <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-slate-600">{t('payslipPreview')}</h3>
            <p className="text-slate-500 mt-2">{t('generatePayslipHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={payslipRef} className="bg-white p-8 md:p-10 flex-grow rounded-t-lg shadow-lg">
        <header className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">{t('payslip')}</h1>
              <p className="text-slate-600">{t('period')}: {payslip.period}</p>
          </div>
          {payslip.employeeProfilePicture ? (
              <img src={payslip.employeeProfilePicture} alt={payslip.employeeName} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
          ) : (
              <UserCircleIcon className="w-20 h-20 text-slate-300" />
          )}
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-2">{t('employeeDetails')}</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="text-slate-500">{t('employeeName')}</div>
            <div className="text-slate-800 font-medium text-right">{payslip.employeeName}</div>
            <div className="text-slate-500">{t('position')}</div>
            <div className="text-slate-800 font-medium text-right">{payslip.employeePosition || '-'}</div>
          </div>
        </section>

        <section className="mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-2">{t('dailyPieceRateEarnings')}</h2>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-2">{t('date')}</th>
                        <th scope="col" className="px-4 py-2">{t('tasks')}</th>
                        <th scope="col" className="px-4 py-2 text-right">{t('groupTotal')}</th>
                        <th scope="col" className="px-4 py-2 text-center">{t('presentCrew')}</th>
                        <th scope="col" className="px-4 py-2 text-right">{t('yourEarning')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payslip.logs.map((log, index) => (
                        <tr key={index} className="bg-white border-b last:border-b-0">
                            <td className="px-4 py-2">{formatDate(log.date)}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">{log.taskName}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatCurrency(log.totalDailyGross)}</td>
                            <td className="px-4 py-2 text-center font-mono">{log.workersPresent}</td>
                            <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">{formatCurrency(log.yourEarning)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>


        <section className="mb-8 space-y-2">
            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <span className="text-slate-600 font-semibold">{t('grossSalary')}</span>
              <span className="text-slate-800 font-semibold font-mono">{formatCurrency(payslip.grossSalary)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('allowancesBonus')}</span>
              <span className="text-green-600 font-mono">+ {formatCurrency(payslip.allowance)}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('deductions')}</span>
              <span className="text-red-600 font-mono">- {formatCurrency(payslip.deduction)}</span>
            </div>
        </section>

        <footer className="border-t-2 border-slate-800 pt-4 text-right">
            <p className="text-slate-600 font-semibold text-lg">{t('netSalary')}</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(payslip.netSalary)}</p>
        </footer>
      </div>
      <div className="bg-white p-4 rounded-b-lg border-t border-slate-200 grid grid-cols-2 gap-3">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors flex items-center justify-center disabled:bg-slate-400"
        >
          <ShareIcon />
          {isSharing ? t('sharing') : t('share')}
        </button>
        <button
          onClick={handleExportPDF}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
        >
          <DownloadIcon />
          {t('exportToPDF')}
        </button>
      </div>
    </div>
  );
};
