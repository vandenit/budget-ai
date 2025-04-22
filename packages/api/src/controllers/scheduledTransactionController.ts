import { Request } from 'express';
import * as ynabService from '../data/ynab/ynab.server';
import { UserType } from '../data/user/user.server';
import { getBudgetFromReq } from './budgetController';
import { getUserFromReq } from './utils';
import { getBudget } from '../data/budget/budget.server';

type RequestWithUser = Request & { user: UserType };

export const update = async (req: RequestWithUser) => {
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
    return result;
};

export const remove = async (req: RequestWithUser) => {
    const { transactionId } = req.params;

    // Check if user has access to this budget
    const budget = await getBudgetFromReq(req);

    await ynabService.deleteScheduledTransaction(
        req.user,
        budget.uuid,
        transactionId
    );
    return { success: true };
};
