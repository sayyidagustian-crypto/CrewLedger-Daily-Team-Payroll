import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import type { Payslip } from '../types';
import { DownloadIcon, UserCircleIcon, PrintIcon, WhatsAppIcon, DocumentTextIcon } from './icons';
import { useI18n } from '../i18n';

export const PayslipPreview: React.FC<{ payslip: Payslip | null }> = ({ payslip }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const { t, formatCurrency, formatDate } = useI18n();
  const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
            setDownloadMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generatePdf = async () => {
    if (!payslip) return null;

    try {
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let cursorY = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(49, 46, 229); // Indigo
        doc.text(t('payslip'), margin, cursorY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139); // Slate
        cursorY += 8;
        doc.text(`${t('period')}: ${payslip.period}`, margin, cursorY);
        
        cursorY += 5;
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);

        cursorY += 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(t('employeeDetails').toUpperCase(), margin, cursorY);

        cursorY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(51, 65, 85);
        doc.text(t('employeeName'), margin, cursorY);
        doc.text(payslip.employeeName, pageWidth - margin, cursorY, { align: 'right' });
        cursorY += 7;
        doc.text(t('position'), margin, cursorY);
        doc.text(payslip.employeePosition || '-', pageWidth - margin, cursorY, { align: 'right' });

        cursorY += 15;
        const tableHead = [[t('date'), t('tasks'), t('groupTotal'), t('presentCrew'), t('yourEarning')]];
        const tableBody = payslip.logs.map(log => [
            formatDate(log.date),
            log.taskName.split(', ').join('\n'), // Key fix for multi-line tasks
            formatCurrency(log.totalDailyGross),
            log.workersPresent.toString(),
            formatCurrency(log.yourEarning)
        ]);

        autoTable(doc, {
            startY: cursorY,
            head: tableHead,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2.5 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'center' },
                4: { halign: 'right', fontStyle: 'bold', textColor: [49, 46, 229] },
            },
            margin: { left: margin, right: margin }
        });
        
        cursorY = (doc as any).autoTable.previous.finalY;

        const summaryLineHeight = 8;
        const footerHeight = 25;
        const spaceNeeded = (10 * 2) + (summaryLineHeight * 3) + footerHeight;

        if (cursorY + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        cursorY += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(t('grossSalary'), margin, cursorY);
        doc.text(formatCurrency(payslip.grossSalary), pageWidth - margin, cursorY, { align: 'right' });

        cursorY += summaryLineHeight;
        doc.setFont('helvetica', 'normal');
        doc.text(t('allowancesBonus'), margin, cursorY);
        doc.setTextColor(22, 163, 74); // green-600
        doc.text(`+ ${formatCurrency(payslip.allowance)}`, pageWidth - margin, cursorY, { align: 'right' });
        
        cursorY += summaryLineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(t('deductions'), margin, cursorY);
        doc.setTextColor(220, 38, 38); // red-600
        doc.text(`- ${formatCurrency(payslip.deduction)}`, pageWidth - margin, cursorY, { align: 'right' });

        cursorY += 12;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 5;

        doc.setFillColor(241, 245, 249);
        doc.rect(margin, cursorY, pageWidth - (margin * 2), footerHeight, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(t('netSalary').toUpperCase(), margin + 5, cursorY + (footerHeight/2) + 2);
        
        doc.setFontSize(22);
        doc.setTextColor(49, 46, 229);
        doc.text(formatCurrency(payslip.netSalary), pageWidth - margin - 5, cursorY + (footerHeight/2) + 5, { align: 'right' });

        return doc;

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert(`${t('pdfGenerationFailedError')}\n\nError: ${(error as Error).message}`);
        return null;
    }
  };

  const generateDocx = async () => {
      if (!payslip) return null;

      try {
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: t('payslip'), heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `${t('period')}: ${payslip.period}`, style: "IntenseQuote" }),
                    new Paragraph({ text: t('employeeDetails').toUpperCase(), heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                        rows: [
                            new TableRow({ children: [ new TableCell({ children: [new Paragraph(t('employeeName'))] }), new TableCell({ children: [new Paragraph({ text: payslip.employeeName, alignment: AlignmentType.RIGHT })] }) ] }),
                            new TableRow({ children: [ new TableCell({ children: [new Paragraph(t('position'))] }), new TableCell({ children: [new Paragraph({ text: payslip.employeePosition || '-', alignment: AlignmentType.RIGHT })] }) ] }),
                        ]
                    }),
                    new Paragraph({ text: t('dailyPieceRateEarnings').toUpperCase(), heading: HeadingLevel.HEADING_3, spacing: { before: 400 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                             new TableRow({
                                tableHeader: true,
                                children: [t('date'), t('tasks'), t('groupTotal'), t('presentCrew'), t('yourEarning')].map(text => new TableCell({ children: [new Paragraph({ text, alignment: AlignmentType.CENTER })] }))
                            }),
                            ...payslip.logs.flatMap(log => {
                                const tasks = log.taskName.split(', ').map(task => new TextRun({ text: task, break: 1 }));
                                return [
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph(formatDate(log.date))] }),
                                            new TableCell({ children: [new Paragraph({ children: tasks })] }),
                                            new TableCell({ children: [new Paragraph({ text: formatCurrency(log.totalDailyGross), alignment: AlignmentType.RIGHT })] }),
                                            new TableCell({ children: [new Paragraph({ text: log.workersPresent.toString(), alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: formatCurrency(log.yourEarning), alignment: AlignmentType.RIGHT })] }),
                                        ]
                                    })
                                ];
                            })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                        rows: [
                           new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: t('grossSalary'), style: "strong" })] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(payslip.grossSalary), alignment: AlignmentType.RIGHT, style: "strong" })] }) ] }),
                           new TableRow({ children: [ new TableCell({ children: [new Paragraph(t('allowancesBonus'))] }), new TableCell({ children: [new Paragraph({ text: `+ ${formatCurrency(payslip.allowance)}`, alignment: AlignmentType.RIGHT })] }) ] }),
                           new TableRow({ children: [ new TableCell({ children: [new Paragraph(t('deductions'))] }), new TableCell({ children: [new Paragraph({ text: `- ${formatCurrency(payslip.deduction)}`, alignment: AlignmentType.RIGHT })] }) ] }),
                           new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: t('netSalary').toUpperCase(), style: "strong" })] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(payslip.netSalary), alignment: AlignmentType.RIGHT, style: "strong" })] }) ] }),
                        ]
                    }),
                ],
            }]
        });

        return Packer.toBlob(doc);
      } catch (error) {
        console.error("DOCX Generation Error:", error);
        alert(`${t('pdfGenerationFailedError')}\n\nError: ${(error as Error).message}`); // Reusing translation key
        return null;
      }
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setDownloadMenuOpen(false);
    
    try {
        const doc = await generatePdf();
        if (doc && payslip) {
            doc.save(`payslip-${payslip.employeeName.replace(/\s/g, '-')}-${payslip.period}.pdf`);
        }
    } catch (error) {
        // Error is already handled in generatePdf, this is just to stop the spinner
        console.error("PDF generation failed:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGenerating(true);
    setDownloadMenuOpen(false);
    
    try {
        const blob = await generateDocx();
        if (blob && payslip) {
            saveAs(blob, `payslip-${payslip.employeeName.replace(/\s/g, '-')}-${payslip.period}.docx`);
        }
    } catch (error) {
        // Error is already handled in generateDocx
        console.error("DOCX generation failed:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShareToWhatsApp = () => {
    if (!payslip) return;
    const nl = '\n';
    let text = `*${t('payslip')}*${nl}${nl}`;
    text += `*${t('employeeName')}:* ${payslip.employeeName}${nl}`;
    text += `*${t('period')}:* ${payslip.period}${nl}`;
    text += `${nl}--- *${t('dailyPieceRateEarnings')}* ---${nl}`;
    payslip.logs.forEach(log => {
        text += `${nl}*🗓️ ${formatDate(log.date)}*${nl}`;
        if (log.taskName && log.taskName !== '-') {
            const tasks = log.taskName.split(', ').map(task => `  • _${task.trim()}_`).join(nl);
            text += `${tasks}${nl}`;
        }
        text += `  *${t('yourEarning')}:* *${formatCurrency(log.yourEarning)}*${nl}`;
    });
    text += `${nl}---${nl}`;
    text += `${nl}*${t('grossSalary')}:* ${formatCurrency(payslip.grossSalary)}${nl}`;
    text += `*${t('allowancesBonus')}:* + ${formatCurrency(payslip.allowance)}${nl}`;
    text += `*${t('deductions')}:* - ${formatCurrency(payslip.deduction)}${nl}`;
    text += `--------------------${nl}`;
    text += `*${t('netSalary')}:* *${formatCurrency(payslip.netSalary)}*${nl}${nl}`;
    text += `_${t('generatedWith', { appName: t('appName') })}_`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };
  
  const handlePrint = () => {
    if (!payslipRef.current) return;
    const printContent = payslipRef.current.outerHTML;
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Print Payslip - ${payslip?.employeeName || ''}</title><script src="https://cdn.tailwindcss.com"></script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><script>tailwind.config = { theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'] } } } }</script><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; } @page { size: A4; margin: 20mm; } .payslip-print-wrapper { box-shadow: none !important; border: none !important; transform: scale(0.95); transform-origin: top left; } .no-print { display: none !important; } }</style></head><body class="bg-white">${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.addEventListener('load', () => { printWindow.print(); printWindow.close(); }, true);
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
      <div ref={payslipRef} className="bg-white p-4 sm:p-6 md:p-8 flex-grow rounded-t-xl payslip-print-wrapper">
        <header className="flex justify-between items-start border-b-2 border-indigo-500 pb-4 mb-6">
          <div>
              <h1 className="text-4xl font-bold text-indigo-600 tracking-tight">{t('payslip')}</h1>
              <p className="text-slate-500 mt-1">{t('period')}: {payslip.period}</p>
          </div>
          {payslip.employeeProfilePicture ? ( <img src={payslip.employeeProfilePicture} alt={payslip.employeeName} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" /> ) : ( <UserCircleIcon className="w-20 h-20 text-slate-300" /> )}
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
                        <th scope="col" className="px-2 py-3 sm:px-4 font-semibold">{t('date')}</th>
                        <th scope="col" className="px-2 py-3 sm:px-4 font-semibold">{t('tasks')}</th>
                        <th scope="col" className="px-2 py-3 sm:px-4 text-right font-semibold">{t('groupTotal')}</th>
                        <th scope="col" className="px-2 py-3 sm:px-4 text-center font-semibold">{t('presentCrew')}</th>
                        <th scope="col" className="px-2 py-3 sm:px-4 text-right font-semibold">{t('yourEarning')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payslip.logs.map((log, index) => (
                        <tr key={index} className="bg-white border-b last:border-b-0 hover:bg-slate-50">
                            <td className="px-2 py-3 sm:px-4 whitespace-nowrap">{formatDate(log.date)}</td>
                            <td className="px-2 py-3 sm:px-4 font-medium text-slate-800 whitespace-pre-line">{log.taskName.split(', ').join('\n')}</td>
                            <td className="px-2 py-3 sm:px-4 text-right font-mono">{formatCurrency(log.totalDailyGross)}</td>
                            <td className="px-2 py-3 sm:px-4 text-center font-mono">{log.workersPresent}</td>
                            <td className="px-2 py-3 sm:px-4 text-right font-mono font-semibold text-indigo-700">{formatCurrency(log.yourEarning)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
        <section className="mt-8 space-y-2">
            <div className="flex justify-between items-center border-t pt-4"> <span className="text-slate-600 text-lg font-semibold">{t('grossSalary')}</span> <span className="text-slate-800 text-lg font-semibold font-mono">{formatCurrency(payslip.grossSalary)}</span> </div>
            <div className="flex justify-between items-center"> <span className="text-slate-600">{t('allowancesBonus')}</span> <span className="text-green-600 font-mono">+ {formatCurrency(payslip.allowance)}</span> </div>
            <div className="flex justify-between items-center"> <span className="text-slate-600">{t('deductions')}</span> <span className="text-red-600 font-mono">- {formatCurrency(payslip.deduction)}</span> </div>
        </section>
        <footer className="bg-indigo-700 text-white p-6 rounded-lg mt-6 text-right shadow-inner">
            <div className="flex justify-between items-center">
                <p className="text-indigo-200 font-semibold uppercase tracking-wider text-sm">{t('netSalary')}</p>
                <p className="text-4xl font-bold font-mono">{formatCurrency(payslip.netSalary)}</p>
            </div>
        </footer>
      </div>
      <div className="bg-slate-100 p-4 rounded-b-xl border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <button onClick={handleShareToWhatsApp} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all flex items-center justify-center transform hover:scale-105 shadow-md hover:shadow-lg">
          <WhatsAppIcon /> {t('shareToWhatsApp')}
        </button>
        <button onClick={handlePrint} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all flex items-center justify-center transform hover:scale-105 shadow-md hover:shadow-lg">
          <PrintIcon /> {t('print')}
        </button>
        <div ref={downloadMenuRef} className="relative">
            <button 
                onClick={() => setDownloadMenuOpen(!isDownloadMenuOpen)} 
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center justify-center transform hover:scale-105 shadow-md hover:shadow-lg disabled:bg-blue-400 disabled:cursor-not-allowed">
                {isGenerating ? (
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <DownloadIcon />
                )}
                {isGenerating ? t('generating') : "Unduh"}
            </button>
            {isDownloadMenuOpen && !isGenerating && (
                <div className="origin-top-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in-up">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleDownloadPdf(); }} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
                            <DocumentTextIcon /> <span className="ml-2">Download as PDF</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleDownloadDocx(); }} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
                           <DocumentTextIcon /> <span className="ml-2">Download as DOCX</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};