import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { caseService } from '../cases/caseService.js';
import { ReportMetadata } from '../../models/ReportMetadata.js';
import { logger } from '../../utils/logger.js';

export class PdfDossierService {
  /**
   * Generates and streams a PDF Evidence Dossier for a specific investigation case.
   */
  public async generateCaseDossierStream(caseId: string, writeStream: NodeJS.WritableStream): Promise<any> {
    const caseData = await caseService.getCaseById(caseId);
    if (!caseData) {
      throw new Error(`Investigation case "${caseId}" not found`);
    }

    const evidenceData = await caseService.getCaseEvidence(caseId);

    // Create Report Metadata record ID
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const reportId = `DOSSIER-${dateCode}-${randomHex}`;
    const timestampStr = new Date().toUTCString();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(writeStream);

    let bytesWritten = 0;
    doc.on('data', (chunk) => {
      bytesWritten += chunk.length;
    });

    // Color Palette
    const navyColor = '#0F172A';
    const blueColor = '#2563EB';
    const redColor = '#DC2626';
    const slateColor = '#475569';
    const lightBg = '#F8FAFC';

    // 1. Header & Branding
    doc.rect(40, 40, 515, 60).fill(navyColor);
    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('FINTRACE AI — EVIDENCE DOSSIER', 55, 52);
    doc.fontSize(9).font('Helvetica').text('Automated Micro-Audit & Ghost-Beneficiary Forensic Report', 55, 75);

    doc.fillColor(slateColor).fontSize(8).font('Helvetica').text(`Report ID: ${reportId}`, 400, 55, { align: 'right' });
    doc.text(`Generated: ${timestampStr}`, 400, 68, { align: 'right' });
    doc.text(`Classification: CONFIDENTIAL AUDIT LEAD`, 400, 81, { align: 'right' });

    doc.moveDown(3);

    // 2. Case Overview Section
    doc.fillColor(navyColor).fontSize(14).font('Helvetica-Bold').text(`Case Investigation Overview: ${caseData.caseId}`);
    doc.strokeColor(blueColor).lineWidth(1.5).moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke();
    doc.moveDown(1);

    const startY = doc.y;
    doc.rect(40, startY, 515, 80).fill(lightBg).stroke('#E2E8F0');

    doc.fillColor(slateColor).fontSize(9).font('Helvetica-Bold').text('Target Entity ID:', 50, startY + 10);
    doc.fillColor(navyColor).font('Helvetica').text(caseData.entityId, 140, startY + 10);

    doc.fillColor(slateColor).font('Helvetica-Bold').text('Entity Type:', 300, startY + 10);
    doc.fillColor(navyColor).font('Helvetica').text((caseData.entityType || 'beneficiary').toUpperCase(), 380, startY + 10);

    doc.fillColor(slateColor).font('Helvetica-Bold').text('Case Status:', 50, startY + 28);
    doc.fillColor(caseData.status === 'RESOLVED' ? '#059669' : caseData.status === 'OPEN' ? redColor : blueColor)
      .font('Helvetica-Bold').text(caseData.status, 140, startY + 28);

    doc.fillColor(slateColor).font('Helvetica-Bold').text('Priority:', 300, startY + 28);
    doc.fillColor(caseData.priority === 'HIGH' ? redColor : '#D97706')
      .font('Helvetica-Bold').text(caseData.priority, 380, startY + 28);

    doc.fillColor(slateColor).font('Helvetica-Bold').text('Lead Investigator:', 50, startY + 46);
    doc.fillColor(navyColor).font('Helvetica').text(caseData.investigator || 'Lead Audit Investigator', 140, startY + 46);

    doc.fillColor(slateColor).font('Helvetica-Bold').text('Created Date:', 300, startY + 46);
    doc.fillColor(navyColor).font('Helvetica').text(new Date(caseData.createdAt).toISOString().slice(0, 10), 380, startY + 46);

    doc.y = startY + 95;

    // 3. Hybrid Risk Engine Score Breakdown
    doc.fillColor(navyColor).fontSize(12).font('Helvetica-Bold').text('Hybrid Risk Score & Anomaly Breakdown');
    doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
    doc.moveDown(0.8);

    const riskY = doc.y;
    doc.rect(40, riskY, 160, 45).fill('#FEF2F2').stroke('#FCA5A5');
    doc.fillColor(redColor).fontSize(16).font('Helvetica-Bold').text(`${caseData.riskScore}/100`, 50, riskY + 10);
    doc.fontSize(8).font('Helvetica').text(`Hybrid Risk Level: ${caseData.riskSeverity || 'HIGH'}`, 50, riskY + 30);

    doc.rect(215, riskY, 160, 45).fill(lightBg).stroke('#E2E8F0');
    doc.fillColor(navyColor).fontSize(14).font('Helvetica-Bold').text(`${caseData.ruleScore ?? caseData.riskScore}/100`, 225, riskY + 10);
    doc.fontSize(8).font('Helvetica').text('Rule-Based Risk Points', 225, riskY + 30);

    doc.rect(390, riskY, 165, 45).fill(lightBg).stroke('#E2E8F0');
    doc.fillColor('#7C3AED').fontSize(14).font('Helvetica-Bold').text(
      caseData.anomalyScore !== undefined ? `${Math.round(caseData.anomalyScore * 100)}% Anomaly` : 'N/A',
      400,
      riskY + 10
    );
    doc.fontSize(8).font('Helvetica').text('Isolation Forest Anomaly Score', 400, riskY + 30);

    doc.y = riskY + 55;

    // 4. Triggered Risk Signals
    doc.fillColor(navyColor).fontSize(12).font('Helvetica-Bold').text('Triggered Risk Signals & Rule Evidence');
    doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
    doc.moveDown(0.8);

    const signals = caseData.riskSignals || [];
    if (signals.length === 0) {
      doc.fillColor(slateColor).fontSize(9).font('Helvetica-Oblique').text('No explainable rule signals triggered for this record.');
      doc.moveDown(1);
    } else {
      signals.forEach((sig: any) => {
        doc.fillColor(redColor).fontSize(9).font('Helvetica-Bold').text(`• [${sig.ruleId}] (+${sig.points} pts) - ${sig.severity} SEVERITY`);
        doc.fillColor(slateColor).fontSize(8.5).font('Helvetica').text(`  ${sig.description}`, { indent: 10 });
        doc.moveDown(0.4);
      });
    }

    doc.moveDown(0.5);

    // 5. Recorded Relationship Evidence
    doc.fillColor(navyColor).fontSize(12).font('Helvetica-Bold').text('Recorded Beneficiary & Disbursement Evidence');
    doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
    doc.moveDown(0.8);

    const bens = evidenceData?.beneficiaries || [];
    if (bens.length > 0) {
      bens.forEach((b: any) => {
        doc.fillColor(navyColor).fontSize(9).font('Helvetica-Bold').text(`Beneficiary: ${b.name} (${b.beneficiaryId})`);
        doc.fillColor(slateColor).fontSize(8).font('Helvetica')
          .text(`Bank Account: ${b.bankAccountNumber} | IFSC: ${b.ifscOrRoutingCode} | Category: ${b.category} | Status: ${b.status}`);
        if (b.identityHash) doc.text(`Identity Hash: ${b.identityHash}`);
        doc.moveDown(0.4);
      });
    }

    const disbs = evidenceData?.disbursements || [];
    if (disbs.length > 0) {
      doc.fillColor(navyColor).fontSize(9).font('Helvetica-Bold').text(`Linked Disbursements (${disbs.length} transactions):`);
      disbs.slice(0, 5).forEach((d: any) => {
        doc.fillColor(slateColor).fontSize(8).font('Helvetica')
          .text(`  - ${d.disbursementId}: ₹${Number(d.amount).toLocaleString('en-IN')} via ${d.paymentChannel} (${d.status}) on ${d.disbursementDate}`);
      });
      if (disbs.length > 5) {
        doc.fillColor(slateColor).fontSize(8).font('Helvetica-Oblique').text(`  ... and ${disbs.length - 5} additional disbursement transactions.`);
      }
      doc.moveDown(0.5);
    }

    // 6. Case Notes & Action Audit Trail
    doc.fillColor(navyColor).fontSize(12).font('Helvetica-Bold').text('Investigator Notes & Audit History');
    doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
    doc.moveDown(0.8);

    const notes = caseData.notes || [];
    if (notes.length === 0) {
      doc.fillColor(slateColor).fontSize(8.5).font('Helvetica-Oblique').text('No investigator notes attached to this case.');
      doc.moveDown(0.6);
    } else {
      notes.forEach((n: any) => {
        doc.fillColor(blueColor).fontSize(8.5).font('Helvetica-Bold').text(`[${new Date(n.createdAt).toISOString().slice(0, 19).replace('T', ' ')}] ${n.author}:`);
        doc.fillColor(navyColor).fontSize(8.5).font('Helvetica').text(`"${n.content}"`, { indent: 10 });
        doc.moveDown(0.3);
      });
    }

    // 7. Mandatory Legal Audit Disclaimer
    doc.moveDown(1);
    doc.rect(40, doc.y, 515, 38).fill('#FFFBEB').stroke('#FCD34D');
    doc.fillColor('#92400E').fontSize(7.5).font('Helvetica-Bold').text('FORENSIC AUDIT DISCLAIMER:', 48, doc.y + 6);
    doc.fillColor('#B45309').fontSize(7).font('Helvetica')
      .text('Automated risk findings, Isolation Forest scores, and shared account indicators are investigative leads for human audit review. They do not constitute legal proof of fraud or official determination of guilt.', 48, doc.y + 2, { width: 500 });

    doc.end();

    // Log Report Metadata event in MongoDB asynchronously
    try {
      if (mongoose.connection.readyState === 1) {
        await ReportMetadata.create({
          reportId,
          caseId,
          reportType: 'CASE_DOSSIER',
          title: `Evidence Dossier for Case ${caseId}`,
          generatedBy: caseData.investigator || 'Lead Audit Investigator',
          fileSize: bytesWritten,
          checksum: crypto.createHash('md5').update(`${reportId}-${caseId}-${timestampStr}`).digest('hex'),
          metadata: {
            entityId: caseData.entityId,
            riskScore: caseData.riskScore,
            status: caseData.status
          }
        });
      }

      // Log action to case audit trail
      await caseService.addNote(caseId, `System: Downloaded PDF Evidence Dossier (Report ID: ${reportId})`, 'System Report Engine');
    } catch (err) {
      logger.warn('Error saving report metadata event:', err);
    }

    return reportId;
  }
}

export const pdfDossierService = new PdfDossierService();
