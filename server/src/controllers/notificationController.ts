// src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const { user } = req as AuthRequest;

    // allow optional ?userId= to filter, default to current user
    const userId =
      (req.query.userId as string | undefined) || user?.userId || undefined;

    const notifications = await notificationService.listNotifications(
      tenantId,
      userId,
    );

    return res.json(notifications);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const notification = await notificationService.markAsRead(tenantId, id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to mark notification as read' });
  }
};

// optional: create in-app/internal notification from API
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const notification = await notificationService.createNotification(
      tenantId,
      {
        userId: req.body.userId,
        title: req.body.title,
        message: req.body.message,
        channel: req.body.channel || 'IN_APP',
        data: req.body.data,
      },
    );

    return res.status(201).json(notification);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create notification' });
  }
};
