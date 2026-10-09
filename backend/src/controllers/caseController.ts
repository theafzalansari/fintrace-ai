import { Request, Response } from 'express';
import { caseService } from '../services/cases/caseService.js';
import { logger } from '../utils/logger.js';

export async function getCasesHandler(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;

    const cases = await caseService.getCases({ status, priority, search });
    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    logger.error('Error fetching investigation cases:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch investigation cases',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function getCaseByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const caseObj = await caseService.getCaseById(id);

    if (!caseObj) {
      res.status(404).json({
        success: false,
        error: { message: `Investigation case "${id}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: caseObj
    });
  } catch (error) {
    logger.error('Error fetching case by ID:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch investigation case details',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function createCaseHandler(req: Request, res: Response): Promise<void> {
  try {
    const { entityId } = req.body || {};
    if (!entityId) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required field "entityId"' }
      });
      return;
    }

    // Check if open case already exists for entity
    const existing = await caseService.getCaseByEntityId(entityId);
    if (existing && existing.status !== 'RESOLVED' && existing.status !== 'DISMISSED') {
      res.status(200).json({
        success: true,
        message: `Active investigation case ${existing.caseId} already exists for entity ${entityId}`,
        data: existing
      });
      return;
    }

    const created = await caseService.createCase(req.body);
    res.status(201).json({
      success: true,
      message: `Investigation case ${created.caseId} created successfully`,
      data: created
    });
  } catch (error) {
    logger.error('Error creating investigation case:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create investigation case',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function updateCaseHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await caseService.updateCase(id, req.body || {});

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { message: `Investigation case "${id}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Investigation case ${id} updated successfully`,
      data: updated
    });
  } catch (error) {
    logger.error('Error updating investigation case:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update investigation case',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function addCaseNoteHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { content, author } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(400).json({
        success: false,
        error: { message: 'Missing or empty required field "content"' }
      });
      return;
    }

    const updated = await caseService.addNote(id, content, author);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { message: `Investigation case "${id}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Investigator note added to case ${id}`,
      data: updated
    });
  } catch (error) {
    logger.error('Error adding note to case:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to add note to investigation case',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function getCaseEvidenceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const evidence = await caseService.getCaseEvidence(id);

    if (!evidence) {
      res.status(404).json({
        success: false,
        error: { message: `Investigation case "${id}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: evidence
    });
  } catch (error) {
    logger.error('Error fetching case evidence:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch case evidence',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
