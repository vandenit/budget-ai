import { Request, Response } from 'express';
import * as ynabService from '../data/ynab/ynab.server';
import { UserType } from '../data/user/user.server';
import { getBudgetFromReq } from './budgetController';
import { getUserFromReq } from './utils';
import { getBudget } from '../data/budget/budget.server';

type RequestWithUser = Request & { user: UserType };

export const update = async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const updates = req.body;
    const user = await getUserFromReq(req);
    if (!user) {
        throw new Error("no user found");
    }
    const budget = await getBudget(req.params.uuid, user);
    if (!budget) {
        throw new Error(`budget ${req.params.uuid} does not belong to user`);
    } 
 
    const result = await ynabService.updateScheduledTransaction(
        user,
        budget.uuid,
        transactionId,
        updates
    );
    res.json(result);
};

export const remove = async (req: RequestWithUser, res: Response) => {
    const { transactionId } = req.params;

    const user = await getUserFromReq(req);
    if (!user) {
        throw new Error("no user found");
    }
    const budget = await getBudget(req.params.uuid, user);
    if (!budget) {
        throw new Error(`budget ${req.params.uuid} does not belong to user`);
    } 
    await ynabService.deleteScheduledTransaction(
        user,
        budget.uuid,
        transactionId
    );
    res.json({ success: true });
};
