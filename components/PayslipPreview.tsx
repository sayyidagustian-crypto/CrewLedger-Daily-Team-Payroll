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

    html2canvas(payslipRef.current, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
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
        const canvas = await window.html2canvas(payslipRef.current, { scale: 2, backgroundColor: '#ffffff' });
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
      <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl border border-slate-200">
        <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-slate-600">{t('payslipPreview')}</h3>
            <p className="text-slate-500 mt-2">{t('generatePayslipHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl shadow-lg border border-slate-200/80 transition-shadow hover:shadow-2xl">
      <div ref={payslipRef} className="bg-white p-6 md:p-8 flex-grow rounded-t-xl">
        <header className="flex justify-between items-start border-b-2 border-indigo-500 pb-4 mb-6">
          <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text tracking-wider font-serif">{t('payslip')}</h1>
              <p className="text-slate-500 mt-1">{t('period')}: {payslip.period}</p>
          </div>
          {payslip.employeeProfilePicture ? (
              <img src={payslip.employeeProfilePicture} alt={payslip.employeeName} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
          ) : (
              <UserCircleIcon className="w-20 h-20 text-slate-300" />
          )}
        </header>

        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">{t('employeeDetails')}</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-base">
            <div className="text-slate-600">{t('employeeName')}</div>
            <div className="text-slate-800 font-semibold text-right">{payslip.employeeName}</div>
            <div className="text-slate-600">{t('position')}</div>
            <div className="text-slate-800 font-semibold text-right">{payslip.employeePosition || '-'}</div>
          </div>
        </section>

        <section className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{t('dailyPieceRateEarnings')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('date')}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('tasks')}</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">{t('groupTotal')}</th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold">{t('presentCrew')}</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">{t('yourEarning')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payslip.logs.map((log, index) => (
                        <tr key={index} className="bg-white border-b last:border-b-0 hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.date)}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{log.taskName}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(log.totalDailyGross)}</td>
                            <td className="px-4 py-3 text-center font-mono">{log.workersPresent}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-indigo-700">{formatCurrency(log.yourEarning)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>


        <section className="mt-8 space-y-2">
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-slate-600 text-lg font-semibold">{t('grossSalary')}</span>
              <span className="text-slate-800 text-lg font-semibold font-mono">{formatCurrency(payslip.grossSalary)}</span>
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

        <footer className="bg-gradient-to-br from-indigo-700 to-blue-600 text-white p-6 rounded-lg mt-6 text-right shadow-inner shadow-lg shadow-indigo-500/20">
            <p className="text-indigo-200 font-semibold uppercase tracking-wider text-sm">{t('netSalary')}</p>
            <p className="text-4xl font-bold font-mono">{formatCurrency(payslip.netSalary)}</p>
        </footer>
      </div>
      <div className="bg-slate-100 p-4 rounded-b-xl border-t border-slate-200 grid grid-cols-2 gap-3">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all flex items-center justify-center disabled:bg-slate-400 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <ShareIcon />
          {isSharing ? t('sharing') : t('share')}
        </button>
        <button
          onClick={handleExportPDF}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <DownloadIcon />
          {t('exportToPDF')}
        </button>
      </div>
    </div>
  );
};