import type { R2Bucket } from '@cloudflare/workers-types';

export interface FailedTransaction {
  transactionId: string;
  clientId: string;
  sourceId: string;
  sourceType: string;
  failureReason: string;
  failureTimestamp: string;
  retryCount: number;
  lastRetryTimestamp?: string;
  transactionData: any;
}

export class FailedTransactionService {
  constructor(private r2Bucket: R2Bucket) {}

  async trackFailedTransaction(
    clientId: string,
    sourceId: string,
    sourceType: string,
    failureReason: string,
    transactionData: any
  ): Promise<void> {
    const transactionId = crypto.randomUUID();
    
    const failedTransaction: FailedTransaction = {
      transactionId,
      clientId,
      sourceId,
      sourceType,
      failureReason,
      failureTimestamp: new Date().toISOString(),
      retryCount: 0,
      transactionData,
    };

    const key = `failed-transactions/${clientId}/${transactionId}.json`;
    
    await this.r2Bucket.put(key, JSON.stringify(failedTransaction, null, 2))
      .catch(err => {
        console.error('Failed to track failed transaction:', JSON.stringify({
          transactionId,
          clientId,
          error: err,
        }, null, 2));
      });
  }

  async getFailedTransactions(clientId?: string): Promise<FailedTransaction[]> {
    const prefix = clientId ? `failed-transactions/${clientId}/` : 'failed-transactions/';
    
    const list = await this.r2Bucket.list({ prefix });
    const transactions: FailedTransaction[] = [];

    for (const object of list.objects) {
      const data = await this.r2Bucket.get(object.key);
      if (data) {
        const text = await data.text();
        transactions.push(JSON.parse(text));
      }
    }

    return transactions.sort((a, b) => 
      new Date(b.failureTimestamp).getTime() - new Date(a.failureTimestamp).getTime()
    );
  }

  async retryFailedTransaction(transactionId: string): Promise<boolean> {
    // Find the failed transaction
    const list = await this.r2Bucket.list({ prefix: 'failed-transactions/' });
    
    let failedTransaction: FailedTransaction | null = null;
    let transactionKey: string | null = null;

    for (const object of list.objects) {
      const data = await this.r2Bucket.get(object.key);
      if (data) {
        const text = await data.text();
        const transaction = JSON.parse(text) as FailedTransaction;
        
        if (transaction.transactionId === transactionId) {
          failedTransaction = transaction;
          transactionKey = object.key;
          break;
        }
      }
    }

    if (!failedTransaction || !transactionKey) {
      console.error('Failed transaction not found:', transactionId);
      return false;
    }

    // Update retry count and timestamp
    failedTransaction.retryCount++;
    failedTransaction.lastRetryTimestamp = new Date().toISOString();

    await this.r2Bucket.put(transactionKey, JSON.stringify(failedTransaction, null, 2));

    return true;
  }

  async markAsResolved(transactionId: string): Promise<void> {
    // Find and delete the failed transaction
    const list = await this.r2Bucket.list({ prefix: 'failed-transactions/' });
    
    for (const object of list.objects) {
      const data = await this.r2Bucket.get(object.key);
      if (data) {
        const text = await data.text();
        const transaction = JSON.parse(text) as FailedTransaction;
        
        if (transaction.transactionId === transactionId) {
          await this.r2Bucket.delete(object.key);
          console.log('Failed transaction marked as resolved:', transactionId);
          return;
        }
      }
    }

    console.warn('Failed transaction not found for resolution:', transactionId);
  }

  async getFailedTransactionById(transactionId: string): Promise<FailedTransaction | null> {
    const list = await this.r2Bucket.list({ prefix: 'failed-transactions/' });
    
    for (const object of list.objects) {
      const data = await this.r2Bucket.get(object.key);
      if (data) {
        const text = await data.text();
        const transaction = JSON.parse(text) as FailedTransaction;
        
        if (transaction.transactionId === transactionId) {
          return transaction;
        }
      }
    }

    return null;
  }
}
